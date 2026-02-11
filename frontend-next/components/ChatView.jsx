export default function ChatView() {
  return (
    <section
      id="chat-view"
      className="w-full h-full min-h-0 flex flex-col items-center px-6 pt-8 pb-6 overflow-hidden"
    >
      {/* Hero 区域 */}
      <div id="hero-section" className="hero-section text-center mb-8 space-y-5 flex-shrink-0 w-full max-w-4xl mx-auto">
        <div className="inline-flex p-6 relative group">
          <div className="solid-card flex items-center justify-center" style={{
            background: 'var(--cream)',
            boxShadow: '6px 6px 0 var(--border-light)'
          }}>
            <div className="w-20 h-20 flex items-center justify-center" style={{
              background: 'var(--burnt)',
              color: 'white',
              boxShadow: '0 3px 0 #8a3d2d'
            }}>
              <i className="fas fa-lightbulb text-4xl"></i>
            </div>
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter title-gradient" style={{
          fontFamily: "'Playfair Display', serif"
        }}>
          Tell me about your idea.
        </h1>

        <p className="text-xl font-medium max-w-xl mx-auto leading-relaxed" style={{
          color: 'var(--text-secondary)'
        }}>
          你的创意补全之旅从这里开始。在下方输入构想，或拖拽项目书（txt/pdf/docx）到此处，AI 将实时生成补全脑图。
        </p>
      </div>

      {/* 拖拽上传区域 */}
      <div
        id="drop-zone"
        className="w-full max-w-[min(96rem,95vw)] flex-shrink-0 mb-4 rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300"
        style={{
          borderColor: 'var(--border-light)',
          background: 'var(--sand)'
        }}
      >
        <input type="file" id="drop-file-input" accept=".txt,.pdf,.docx" className="hidden" />
        <label htmlFor="drop-file-input" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-16 h-16 solid-card flex items-center justify-center" style={{
            background: 'var(--cobalt)',
            color: 'white'
          }}>
            <i className="fas fa-file-import text-2xl"></i>
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            将项目书拖拽到此处，或<u style={{ color: 'var(--cobalt)' }}>点击上传</u>
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            支持 .txt、.pdf、.docx，最大 5MB
          </span>
        </label>
      </div>

      {/* 聊天历史 */}
      <div
        id="chat-history"
        className="w-full max-w-[min(96rem,95vw)] flex-1 min-h-0 space-y-3 mb-3 overflow-y-auto max-h-[75vh] px-4 py-2 custom-scrollbar"
      ></div>

      {/* 输入区域 */}
      <div className="w-full max-w-[min(96rem,95vw)] flex-shrink-0 solid-card p-4 flex items-center gap-4 transition-all group">
        <div className="pl-2" style={{ color: 'var(--cobalt)' }}>
          <i className="fas fa-terminal text-lg opacity-50"></i>
        </div>
        <textarea
          id="initial-input"
          rows="2"
          placeholder="描述你的项目目标、愿景或核心功能… Enter 发送，Shift+Enter 换行"
          className="flex-1 min-h-0 bg-transparent border-none outline-none px-4 py-2 text-lg leading-relaxed font-medium resize-none"
          style={{
            color: 'var(--text-primary)',
            fontFamily: "'Inter', sans-serif"
          }}
        ></textarea>
        <button
          id="start-btn"
          className="w-14 h-14 flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: 'var(--burnt)',
            color: 'white',
            boxShadow: '0 4px 0 #8a3d2d'
          }}
        >
          <i className="fas fa-chevron-right text-xl"></i>
        </button>
      </div>
    </section>
  );
}
