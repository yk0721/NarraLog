import {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import {Stomp, CompatClient} from '@stomp/stompjs';
import {Send, MessageCircle, Smile, Users, ArrowRight} from 'lucide-react';
import {Swiper, SwiperSlide} from 'swiper/react';
axios.defaults.withCredentials = true;
// @ts-ignore
import 'swiper/css';

// 型定義
type Problem = { id: string; content: string; title: string; };
type Message = { id?: string; sender: string; content: string; };

function App() {
    const [user, setUser] = useState<{username: string} | null>(
        JSON.parse(localStorage.getItem('narralog_user') || 'null')
    );
    const [loginName] = useState('');
    const [view, setView] = useState<'HOME' | 'CHAT'>('HOME');
    const [input, setInput] = useState('');
    const [problems, setProblems] = useState<Problem[]>([]); // ★追加: 相談リスト
    const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');

    const stompClientRef = useRef<CompatClient | null>(null);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async () => {
        try {
            if (isRegisterMode) {
                // --- 新規登録 ---
                await axios.post('http://localhost:8080/api/register', {
                    username, email, password
                });
                alert("登録完了！ログインします。");
                setIsRegisterMode(false); // ログイン画面へ
            } else {
                // --- ログイン ---
                await axios.post('http://localhost:8080/api/login', {
                    email, password
                });
                // 成功したらユーザー情報を保存
                const userData = { username: username || "User" }; // 本来はレスポンスから取るべき
                setUser(userData);
                localStorage.setItem('narralog_user', JSON.stringify(userData));
                fetchProblems();
            }
        } catch (e: any) {
            alert("認証失敗: " + (e.response?.data?.message || "エラーが発生しました"));
            console.error(e);
        }
    };

    const handleLogin = async () => {
        console.log("① ボタンがクリックされました"); // これが出なければonClickの設定ミス

        if (!loginName) {
            alert("名前を入力してください！");
            return;
        }

        try {
            console.log("② ログイン通信を開始します...", loginName);

            // バックエンドへ送信
            const res = await axios.post('http://localhost:8080/api/login', { username: loginName });

            console.log("③ サーバーからの応答:", res); // これが出れば通信成功

            if (res.status === 200) {
                console.log("④ ログイン成功！画面を切り替えます");
                const userData = { username: loginName };
                setUser(userData);
                localStorage.setItem('narralog_user', JSON.stringify(userData));

                // 一覧取得
                console.log("⑤ 相談一覧を取得しに行きます");
                await fetchProblems();
            }
        } catch (e: any) {
            // ここでエラー内容をポップアップで表示！
            console.error("★エラー発生:", e);
            alert(`エラーが発生しました！\n内容: ${e.message}\n(詳細はF12コンソールを見てください)`);

            if (axios.isAxiosError(e) && e.response) {
                console.log("サーバーのレスポンス:", e.response.status, e.response.data);
            }
        }
    };

    // ★追加: 初回ロード時に相談一覧を取得
    useEffect(() => {
        //fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/problems');
            setProblems(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    // 1. ボヤき投稿 (部屋作成)
    const createProblem = async () => {
        if (!input) return;
        try {
            const res = await axios.post('http://localhost:8080/api/problems', {content: input});
            // 作成したらすぐ参加
            await joinProblem(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    // ★追加: 既存の部屋に参加する処理
    const joinProblem = async (problem: Problem) => {
        setCurrentProblem(problem);

        // 過去ログを取得
        try {
            const res = await axios.get(`http://localhost:8080/api/problems/${problem.id}/messages`);
            setMessages(res.data);
        } catch (e) {
            console.error(e);
        }

        connectWebSocket(problem.id);
        setView('CHAT');
    };

    // 2. WebSocket接続
    const connectWebSocket = (problemId: string) => {
        // 既存の接続があれば切る
        if (stompClientRef.current) stompClientRef.current.disconnect();

        const socket = new SockJS('http://localhost:8080/ws');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            client.subscribe(`/topic/problems/${problemId}`, (msg) => {
                const receivedMsg = JSON.parse(msg.body);
                setMessages((prev) => [...prev, receivedMsg]);
            });
        });
        stompClientRef.current = client;
    };

    // 3. メッセージ送信
    const sendMessage = () => {
        if (!chatInput || !currentProblem || !stompClientRef.current) return;
        const msg = {sender: user.username, content: chatInput};
        stompClientRef.current.send(`/app/chat/${currentProblem.id}`, {}, JSON.stringify(msg));
        setChatInput('');
    };

    // チャットから戻る
    const leaveChat = () => {
        if (stompClientRef.current) stompClientRef.current.disconnect();
        setView('HOME');
        setCurrentProblem(null);
        setMessages([]);
        fetchProblems(); // 最新リストに更新
    };

    // 描画部分（return内）のログイン画面エリア
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
                    <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                        {isRegisterMode ? "新規登録" : "ログイン"}
                    </h1>

                    {/* ... ここに登録・ログイン用の入力フォーム ... */}
                    <div className="space-y-4">
                        {isRegisterMode && (
                            <input
                                className="w-full p-3 border rounded-lg text-gray-800"
                                placeholder="ユーザー名"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        )}
                        <input className="w-full p-3 border rounded-lg text-gray-800" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <input className="w-full p-3 border rounded-lg text-gray-800" type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button onClick={handleAuth} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
                            {isRegisterMode ? "登録" : "ログイン"}
                        </button>
                    </div>
                    <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="w-full mt-4 text-sm text-blue-600 underline">
                        {isRegisterMode ? "ログインへ戻る" : "新規登録はこちら"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full bg-white shadow-xl min-h-screen flex flex-col">

                {/* ヘッダー：ログアウトボタンもついでに追加しちゃいましょう */}
                <header className="p-4 bg-white border-b flex justify-between items-center">
                    {view === 'CHAT' && (
                        <button onClick={leaveChat} className="text-gray-500 hover:text-blue-600 mr-2">
                            ←
                        </button>
                    )}
                    <h1 className="font-bold text-xl text-blue-600">test</h1>
                    <button
                        onClick={() => { setUser(null); localStorage.removeItem('narralog_user'); }}
                        className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                    >
                        ログアウト
                    </button>
                </header>

                {view === 'HOME' ? (
                    <div className="p-4 flex flex-col gap-6">
                        {/* 相談一覧や投稿フォームのコード */}
                        <div className="bg-blue-50 p-4 rounded-xl">
                            <h2 className="font-bold mb-2 text-gray-800">こんにちは、{user.username}さん</h2>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h2 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                    <MessageCircle size={18}/> 新しい相談を作る
                                </h2>
                                <textarea
                                    className="w-full p-3 border rounded-lg text-sm mb-2 focus:outline-blue-400 text-gray-800"
                                    rows={2}
                                    placeholder="例：会議が多すぎて作業が進まない..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}/>
                                <button
                                    onClick={createProblem}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition"
                                >
                                    相談開始
                                </button>
                            </div>
                        </div>
                        {/* ... 相談リスト ... */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Users size={18}/> みんなの相談 ({problems.length})
                            </h3>
                            <div className="space-y-3">
                                <Swiper spaceBetween={3} breakpoints={{
                                    640: {slidesPerView: 3},
                                    1200: {slidesPerView: 5},
                                }}>
                                    {problems.map(p => (
                                        <SwiperSlide key={p.id}>
                                            <div key={p.id}
                                                 className="border p-4 rounded-xl hover:shadow-md transition bg-white h-52">
                                                <h4 className="font-bold text-gray-800 mb-1 text-lg">{p.title}</h4>
                                                <p className="text-xs text-gray-500 mb-3 truncate">詳細:<br></br>{p.content}
                                                </p>
                                                <button
                                                    onClick={() => joinProblem(p)}
                                                    className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 flex items-center justify-center gap-2 absolute left-0 bottom-0.5"
                                                >
                                                    議論に参加する <ArrowRight size={14}/>
                                                </button>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                    {problems.length === 0 &&
                                        <p className="text-center text-gray-400 text-sm">まだ相談はありません</p>}
                                </Swiper>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* チャット画面のコード */
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="bg-blue-50 p-3 text-sm text-blue-800 border-b shadow-sm z-10">
                            <span className="font-bold">議題：</span> {currentProblem?.title}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((m, i) => (
                                <div key={i}
                                     className={`flex ${m.sender === user.username ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${m.sender === user.username
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                                        <div
                                            className={`text-[10px] mb-1 ${m.sender === user.username ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {m.sender}
                                        </div>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 border-t bg-white flex gap-2 pb-6">
                            <button className="p-2 text-gray-400 hover:text-yellow-500"><Smile size={24}/></button>
                            <input
                                className="flex-1 bg-gray-100 rounded-full px-4 outline-none text-sm text-gray-800"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="メッセージを入力..."/>
                            <button onClick={sendMessage}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                                <Send size={18}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

}

export default App;