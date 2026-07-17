// middleware.js — リポジトリのルート（index.htmlと同じ階層）に置く
// admin.html へのアクセスにBasic認証をかける（Vercel Edge Middleware・無料プランで動作）
//
// セットアップ:
// 1. このファイルをリポジトリのルートに置く
// 2. Vercelのダッシュボード → プロジェクト → Settings → Environment Variables で
//    ADMIN_BASIC_USER と ADMIN_BASIC_PASS を追加（例: aporia / 長いランダム文字列）
// 3. 再デプロイ（pushすれば自動）
//
// 以降、/admin.html を開くとブラウザ標準のID/パスワード入力が出る。
// これを通過した先に、従来どおりSupabaseログイン＋is_admin判定がある（二段構え）。

export const config = {
  matcher: ['/admin.html'],
};

export default function middleware(request) {
  const USER = process.env.ADMIN_BASIC_USER || '';
  const PASS = process.env.ADMIN_BASIC_PASS || '';

  // 環境変数が未設定のままデプロイされた場合は、安全側に倒して全拒否する
  if (!USER || !PASS) {
    return new Response('Admin access is not configured.', { status: 403 });
  }

  const auth = request.headers.get('authorization') || '';
  const [scheme, encoded] = auth.split(' ');

  if (scheme === 'Basic' && encoded) {
    try {
      const decoded = atob(encoded);
      const idx = decoded.indexOf(':');
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (user === USER && pass === PASS) {
        return; // 認証OK → そのまま admin.html を配信
      }
    } catch (_e) { /* 不正なヘッダーは下の401へ */ }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Aporia Admin", charset="UTF-8"' },
  });
}
