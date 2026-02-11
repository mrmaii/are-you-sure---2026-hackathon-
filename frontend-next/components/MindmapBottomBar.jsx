export default function MindmapBottomBar() {
  return (
    <div
      id="mindmap-bottom-bar"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 flex flex-col gap-4 items-center z-10 pointer-events-none"
    >
      {/* 问题浮窗 */}
      <div
        id="question-float"
        className="w-full flex justify-start opacity-0 pointer-events-none transition-all duration-300 translate-y-2"
      >
        <div
          id="question-float-card"
          className="solid-card p-5 w-[400px] max-w-[400px] pointer-events-none"
          style={{
            boxShadow: '4px 4px 0 var(--border-light)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" style={{
              background: 'var(--cobalt)',
              color: 'white'
            }}>
              当前问题
            </span>
            <span id="question-float-title" className="text-lg font-bold" style={{
              color: 'var(--text-primary)'
            }}></span>
          </div>
          <div
            id="question-float-text"
            className="font-medium text-sm leading-relaxed max-h-56 overflow-y-auto custom-scrollbar pr-1"
            style={{ color: 'var(--text-secondary)' }}
          ></div>
        </div>
      </div>

      {/* 节点面板 */}
      <div
        id="node-panel"
        className="w-full solid-card p-5 flex items-center gap-5 translate-y-28 opacity-0 pointer-events-none transition-all duration-600"
        style={{
          boxShadow: '6px 6px 0 var(--border-light)'
        }}
      >
        <div className="w-16 h-16 flex items-center justify-center flex-shrink-0" style={{
          background: 'linear-gradient(135deg, var(--cobalt), var(--burnt))',
          color: 'white',
          boxShadow: '0 3px 0 #2d4560'
        }}>
          <i className="fas fa-feather-pointed text-2xl"></i>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest" style={{
              background: 'var(--moss)',
              color: 'white'
            }}>
              作答
            </span>
            <span id="active-node-name" className="text-base font-bold truncate" style={{
              color: 'var(--text-primary)'
            }}></span>
          </div>
          <textarea
            id="node-input"
            rows="3"
            placeholder="在此输入你的回答…（可多行）"
            className="w-full bg-transparent border-none outline-none text-base py-2 font-semibold resize-none"
            style={{
              color: 'var(--text-primary)',
              fontFamily: "'Inter', sans-serif"
            }}
          ></textarea>
        </div>
        <button
          id="node-submit"
          className="px-10 py-4 font-bold text-lg flex-shrink-0 success-btn"
        >
          完成作答
        </button>
      </div>
    </div>
  );
}
