export default function TopBar() {
  return (
    <header
      id="top-bar"
      className="fixed top-8 left-1/2 -translate-x-1/2 w-[94%] max-w-7xl z-[100] opacity-0 transition-all duration-800 -translate-y-6 pointer-events-none"
    >
      <div className="solid-card px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, var(--cobalt), var(--burnt))',
              color: 'white',
              boxShadow: '0 3px 0 #2d4560'
            }}>
              <i className="fas fa-microchip text-lg"></i>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{
                color: 'var(--text-muted)',
                fontFamily: "'IBM Plex Mono', monospace"
              }}>
                ENTROPY_MAP
              </div>
              <h2 id="project-title-display" className="font-bold tracking-tight text-lg" style={{
                color: 'var(--text-primary)'
              }}>
                AI Project
              </h2>
              {/* 进度指示条 */}
              <div className="flex gap-1 mt-1">
                <div className="w-2 h-1" style={{ background: 'var(--cobalt)' }}></div>
                <div className="w-2 h-1" style={{ background: 'var(--burnt)' }}></div>
                <div className="w-2 h-1" style={{ background: 'var(--gold)' }}></div>
                <div className="w-2 h-1" style={{ background: 'var(--moss)' }}></div>
              </div>
            </div>
          </div>
          <div className="h-8 w-[2px]" style={{ background: 'var(--border-light)' }}></div>

          {/* 进度条 */}
          <div className="flex flex-col w-52">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2" style={{
              color: 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono', monospace"
            }}>
              <span>COMPLETION</span>
              <span id="progress-text" style={{ color: 'var(--moss)' }}>0%</span>
            </div>
            <div className="h-2 rounded-sm overflow-hidden" style={{ background: 'var(--border-light)' }}>
              <div
                id="progress-fill"
                className="h-full rounded-sm w-0 transition-all duration-700 ease-out"
                style={{ background: 'var(--moss)' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            id="super-agent-btn"
            className="px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 primary-btn disabled"
            title="自动发散：AI 追问 → AI 回答，导图像树枝一样扩散"
          >
            <i className="fas fa-network-wired"></i>
            <span id="super-agent-btn-text">超级 Agent</span>
          </button>
          <button
            id="merge-btn"
            className="px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 cursor-not-allowed opacity-60"
            style={{
              background: 'var(--border-light)',
              color: 'var(--text-muted)'
            }}
          >
            <i className="fas fa-sparkles" style={{ color: 'var(--gold)' }}></i>
            融合项目成果
          </button>
        </div>
      </div>
    </header>
  );
}
