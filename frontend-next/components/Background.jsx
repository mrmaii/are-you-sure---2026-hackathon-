export default function Background() {
  return (
    <>
      {/* 噪点纹理背景 */}
      <div className="noise-bg"></div>
      {/* 几何线条网格 */}
      <div className="geometry-bg"></div>
      {/* 方形自定义光标 - 替换圆形玻璃态 */}
      <div id="custom-cursor"></div>
      <div id="custom-cursor-dot"></div>
    </>
  );
}
