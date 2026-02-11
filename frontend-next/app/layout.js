import "./globals.css";

export const metadata = {
  title: "熵导图 · 控制信息的熵增与熵减",
  description: "MindBridge — 用对话补全你的项目脑图",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-screen w-screen flex flex-col items-center justify-center"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
