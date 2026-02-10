import { useState } from 'react';
import axios from 'axios';

export const BoyakiInput = () => {
    const [text, setText] = useState("");

    const handleSubmit = async () => {
        // Spring BootのAPIを叩く
        const response = await axios.post('/api/problems', { content: text });
        console.log("AIが構造化しました:", response.data);
        // 次の「AI構造化プレビュー画面」へ遷移する処理をここに書く
    };

    return (
        <div className="p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold">今のモヤモヤを書き出そう</h2>
            <textarea
                className="border-2 border-dashed border-gray-300 p-4 rounded-xl h-40 focus:border-blue-400 outline-none"
                placeholder="例：チームのMTGがいつも長引いて、結局何も決まらないのが辛い..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white py-3 rounded-full font-bold shadow-lg active:scale-95 transition"
            >
                AIと一緒に整理する →
            </button>
        </div>
    );
};