export default function Overlays() {
  return (
    <>
      {/* 结果弹窗 */}
      <div
        id="result-modal"
        className="fixed inset-0 z-[200] hidden items-center justify-center bg-black/20 p-12 backdrop-blur-sm"
      >
        <div
          className="solid-card flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden"
          style={{ boxShadow: "8px 8px 0 var(--border-light)" }}
        >
          <div
            className="flex items-center justify-between border-b-2 px-12 py-10"
            style={{ borderColor: "var(--border-light)", background: "var(--cream)" }}
          >
            <div className="space-y-1">
              <h2 className="title-gradient text-4xl font-bold tracking-tight">项目全景方案</h2>
              <p
                className="mb-3 text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)", fontFamily: '"IBM Plex Mono", monospace' }}
              >
                // PROJECT_BLUEPRINT
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                以当前脑图全部节点问答为唯一依据生成，全面覆盖不篡改
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.closeModal && window.closeModal()}
              className="flex h-14 w-14 items-center justify-center rounded-sm border-2 transition-all hover:bg-[var(--sand)]"
              style={{ borderColor: "var(--border-light)", color: "var(--text-muted)" }}
              aria-label="关闭"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <div
            id="result-content"
            className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-16"
          ></div>
          <div className="flex gap-6 border-t-2 p-10" style={{ borderColor: "var(--border-light)" }}>
            <button id="download-pdf-btn" type="button" className="success-btn flex-1 py-5 text-lg font-bold">
              下载 PDF 报告
            </button>
            <button
              className="flex-1 border-2 py-5 text-lg font-bold transition-all hover:bg-[var(--sand)]"
              style={{ borderColor: "var(--moss)", color: "var(--moss)", boxShadow: "0 3px 0 #2d5a38" }}
            >
              分享至协作平台
            </button>
          </div>
        </div>
      </div>

      {/* 超级Agent中心覆盖层 */}
      <div
        id="super-agent-center-overlay"
        className="fixed inset-0 z-[240] flex items-center justify-center opacity-0 transition-opacity duration-300 pointer-events-none"
      >
        <div
          id="super-agent-center-box"
          className="rounded-lg px-8 py-6 text-center"
          style={{
            background: "var(--cream)",
            border: "2px solid var(--border-light)",
            boxShadow: "8px 8px 0 var(--border-light)",
            minWidth: "280px",
          }}
        >
          <div
            id="super-agent-phase-title"
            className="mb-4 text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: "var(--text-primary)" }}
          >
            AI 托管发散中
          </div>
          <div id="super-agent-progress-text" className="mb-1 text-lg font-bold" style={{ color: "var(--text-secondary)" }}>
            目前进度 0%
          </div>
          <div
            id="super-agent-detail"
            className="mb-2 min-h-[1.25rem] text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
          ></div>
          <div
            id="super-agent-eta-text"
            className="text-base font-semibold"
            style={{ color: "var(--text-muted)", fontFamily: '"IBM Plex Mono", monospace' }}
          >
            预计约 — 后完成收敛
          </div>
        </div>
      </div>

      {/* 超级Agent弹窗 */}
      <div
        id="super-agent-burst-1"
        className="super-agent-burst fixed left-[3%] top-[8%] z-[250] min-h-[100px] w-[min(92vw,360px)] -translate-x-4 p-5 opacity-0 pointer-events-none transition-all duration-300 solid-card"
        style={{ boxShadow: "4px 4px 0 var(--border-light)" }}
        data-position="tl"
      >
        <div
          className="burst-title mb-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--cobalt)", fontFamily: '"IBM Plex Mono", monospace' }}
        >
          // CURRENT_Q
        </div>
        <div
          className="burst-content max-h-[140px] overflow-y-auto whitespace-pre-wrap text-sm font-semibold leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        ></div>
      </div>

      <div
        id="super-agent-burst-2"
        className="super-agent-burst fixed right-[3%] top-[8%] z-[250] min-h-[100px] w-[min(92vw,360px)] translate-x-4 p-5 opacity-0 pointer-events-none transition-all duration-300 solid-card"
        style={{ boxShadow: "4px 4px 0 var(--border-light)" }}
        data-position="tr"
      >
        <div
          className="burst-title mb-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--cobalt)", fontFamily: '"IBM Plex Mono", monospace' }}
        >
          // SELECTED_OPTION
        </div>
        <div
          className="burst-content max-h-[140px] overflow-y-auto whitespace-pre-wrap text-sm font-semibold leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        ></div>
      </div>

      <div
        id="super-agent-burst-3"
        className="super-agent-burst fixed bottom-[12%] right-[3%] z-[250] min-h-[90px] w-[min(92vw,340px)] translate-x-4 p-5 opacity-0 pointer-events-none transition-all duration-300 solid-card"
        style={{ boxShadow: "4px 4px 0 var(--border-light)" }}
        data-position="br"
      >
        <div
          className="burst-title mb-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--moss)", fontFamily: '"IBM Plex Mono", monospace' }}
        >
          // APPLIED
        </div>
        <div
          className="burst-content max-h-[120px] overflow-y-auto whitespace-pre-wrap text-sm font-semibold leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        ></div>
      </div>

      <div
        id="super-agent-burst-4"
        className="super-agent-burst fixed bottom-[12%] left-[3%] z-[250] min-h-[90px] w-[min(92vw,340px)] -translate-x-4 p-5 opacity-0 pointer-events-none transition-all duration-300 solid-card"
        style={{ boxShadow: "4px 4px 0 var(--border-light)" }}
        data-position="bl"
      >
        <div
          className="burst-title mb-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-muted)", fontFamily: '"IBM Plex Mono", monospace' }}
        >
          // STEP_COMPLETE
        </div>
        <div
          className="burst-content max-h-[120px] overflow-y-auto whitespace-pre-wrap text-sm font-semibold leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        ></div>
      </div>

      {/* 超级Agent额外信息 */}
      <div
        id="super-agent-extra"
        className="fixed inset-0 z-[235] opacity-0 transition-opacity duration-300 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute left-[2%] top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 rounded-lg border-2 px-5 py-4"
          style={{ background: "var(--cream)", borderColor: "var(--border-light)", boxShadow: "4px 4px 0 var(--border-light)" }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center text-4xl"
            style={{ background: "var(--cobalt)", color: "white", boxShadow: "0 3px 0 #2d4560" }}
          >
            <i className="fas fa-bolt"></i>
          </div>
          <span
            className="whitespace-nowrap text-xs font-bold"
            style={{ color: "var(--text-primary)", fontFamily: '"IBM Plex Mono", monospace' }}
          >
            // AI_ACTIVE
          </span>
        </div>
        <div
          className="absolute right-[2%] top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 rounded-lg border-2 px-5 py-4"
          style={{ background: "var(--cream)", borderColor: "var(--border-light)", boxShadow: "4px 4px 0 var(--border-light)" }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center text-4xl"
            style={{ background: "var(--moss)", color: "white", boxShadow: "0 3px 0 #2d5a38" }}
          >
            <i className="fas fa-brain"></i>
          </div>
          <span
            className="whitespace-nowrap text-xs font-bold"
            style={{ color: "var(--text-primary)", fontFamily: '"IBM Plex Mono", monospace' }}
          >
            // AI_ASSIST
          </span>
        </div>
        <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            id="super-agent-exit-btn"
            type="button"
            className="rounded-sm px-6 py-2 text-sm font-bold transition-all"
            style={{ background: "var(--border-light)", color: "var(--text-primary)", boxShadow: "0 2px 0 var(--text-muted)" }}
          >
            退出
          </button>
        </div>
      </div>

      {/* Toast 通知 */}
      <div
        id="toast"
        className="toast-slide toast-retracted fixed left-1/2 top-0 z-[300] mt-6 flex -translate-x-1/2 items-center gap-4 px-6 py-4 transition-transform duration-300 ease-out solid-card"
        style={{ boxShadow: "4px 4px 0 var(--border-light)" }}
      >
        <div id="toast-icon" className="h-10 w-10 flex-shrink-0 rounded-sm flex items-center justify-center"></div>
        <div className="flex min-w-0 flex-col">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: '"IBM Plex Mono", monospace' }}
          >
            // NOTIFICATION
          </span>
          <span id="toast-text" className="text-sm font-bold" style={{ color: "var(--text-primary)" }}></span>
        </div>
      </div>
    </>
  );
}
