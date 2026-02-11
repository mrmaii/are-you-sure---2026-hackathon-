export default function ContextMenus() {
  return (
    <>
      {/* 节点右键菜单 - 使用CSS中定义的样式 */}
      <div id="node-context-menu" className="fixed z-[120] hidden" aria-hidden="true">
        <div className="entropy-menu-disk">
          <div className="entropy-menu-group increase" data-group="increase">
            <button type="button" className="group-trigger" aria-haspopup="true" aria-expanded="false">
              <span className="group-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10M12 10c0-2 1.5-4 4-4s4 2 4 4c0 2-2 3-2 5M12 10c0-2-1.5-4-4-4S4 8 4 10c0 2 2 3 2 5" />
                  <path d="M12 4v2" />
                  <circle cx="12" cy="8" r="1.5" />
                </svg>
              </span>
              <span className="group-label">熵增方案</span>
            </button>
            <div className="entropy-submenu" role="menu">
              <div className="increase-item" role="none">
                <button type="button" role="menuitem" data-action="spawn">
                  <span className="submenu-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12h6M12 9v6" />
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 6v2M12 16v2M6 12h2M16 12h2" />
                    </svg>
                  </span>
                  <span className="submenu-label">追问</span>
                </button>
              </div>
              <div className="increase-item" role="none">
                <button type="button" role="menuitem" data-action="web-search">
                  <span className="submenu-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </span>
                  <span className="submenu-label">网页</span>
                </button>
              </div>
            </div>
          </div>
          <div className="entropy-menu-group decrease" data-group="decrease">
            <button type="button" className="group-trigger" aria-haspopup="true" aria-expanded="false">
              <span className="group-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 1.95.64 2.78a4.5 4.5 0 0 1 1.41 2.5" />
                  <path d="M12 2v2" />
                </svg>
              </span>
              <span className="group-label">熵减方案</span>
            </button>
            <div className="entropy-submenu" role="menu">
              <div className="decrease-item" role="none">
                <button type="button" role="menuitem" data-action="answer">
                  <span className="submenu-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19l3-3h-2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2l-3 3z" />
                      <path d="M8 5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2l3 3-3-3h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2z" />
                    </svg>
                  </span>
                  <span className="submenu-label">人工熵减</span>
                </button>
              </div>
              <div className="decrease-item" role="none">
                <button type="button" role="menuitem" data-action="tips">
                  <span className="submenu-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
                      <path d="M5 15l1.5 2L5 19l1.5 2" />
                      <path d="M19 15l-1.5 2L19 19l-1.5 2" />
                    </svg>
                  </span>
                  <span className="submenu-label">智能熵减</span>
                </button>
              </div>
              <div className="decrease-item link-materials-wrap" role="none">
                <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{
                  color: 'var(--text-muted)',
                  fontFamily: "'IBM Plex Mono', monospace"
                }}>
                  // LINK_MATERIALS
                </div>
                <div id="context-menu-materials" className="flex flex-col gap-0.5 max-h-32 overflow-y-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 空白处右键菜单 */}
      <div
        id="blank-context-menu"
        className="fixed z-[120] hidden rounded-lg solid-card px-3 py-2 min-w-[140px]"
      >
        <button
          type="button"
          id="blank-menu-import-material"
          className="w-full text-left px-3 py-2 text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-[var(--sand)]"
          style={{ color: 'var(--text-primary)' }}
        >
          <i className="fas fa-link" style={{ color: 'var(--cobalt)' }}></i>
          <span>导入材料</span>
        </button>
      </div>
    </>
  );
}
