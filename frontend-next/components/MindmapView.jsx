export default function MindmapView({ children }) {
  return (
    <section
      id="mindmap-view"
      className="absolute inset-0 opacity-0 pointer-events-none transition-all duration-1000 scale-95"
    >
      <div id="canvas-container">
        <div id="canvas-inner"></div>
      </div>
      {children}
    </section>
  );
}
