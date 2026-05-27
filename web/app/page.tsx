import { redirect } from 'next/navigation';

// 主路徑自動跳到 /device 裝置 POC
// 之前的主對話 demo（場景按鈕 / chat UI / dashboard / IoT 觸發）已停用
// 對齊設計稿 12 畫面、只展示 /device 8 吋裝置實機 POC
export default function HomePage() {
  redirect('/device');
}
