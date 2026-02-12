"use client";

import { useEffect } from "react";

// 背景 + 自定义光标（按照你之前那版：蓝色圆环 + 点击缩成球 + 涟漪）
export default function Background() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;

    const handleMouseMove = (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const createRipple = (x, y) => {
      const ripple = document.createElement("div");
      ripple.className = "cursor-ripple cursor-ripple-active";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      document.body.appendChild(ripple);
      setTimeout(() => {
        ripple.remove();
      }, 450);
    };

    const handleMouseDown = (e) => {
      cursor.classList.add("cursor-clicked");
      createRipple(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      cursor.classList.remove("cursor-clicked");
    };

    // 可点击元素上轻微放大 + 不同语义颜色
    const clickableSelector =
      "a, button, [role='button'], input[type='checkbox'], input[type='radio'], textarea, input, select, #drop-zone, .node, #start-btn, #super-agent-btn, #blank-context-menu button, #node-context-menu button, #question-float-card";

    const handlePointerMove = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      // 先清空语义颜色类
      cursor.classList.remove(
        "cursor-color-blue",
        "cursor-color-red",
        "cursor-color-green"
      );

      const isQuestion =
        target.closest("#question-float-card") ||
        target.closest("[data-role='question']") ||
        target.closest(".question-card");

      const isInput =
        target.closest("textarea") ||
        target.closest("input") ||
        target.closest("select");

      const isDraggableOrInteractive =
        target.closest("#drop-zone") ||
        target.closest(".node") ||
        target.closest("a, button, [role='button']") ||
        target.closest("#start-btn") ||
        target.closest("#super-agent-btn") ||
        target.closest("#blank-context-menu button") ||
        target.closest("#node-context-menu button");

      if (isQuestion) {
        cursor.classList.add("cursor-color-red", "cursor-hover");
      } else if (isInput || isDraggableOrInteractive) {
        cursor.classList.add("cursor-color-green", "cursor-hover");
      } else if (target.closest(clickableSelector)) {
        // 兜底：其它可交互也按绿色处理
        cursor.classList.add("cursor-color-green", "cursor-hover");
      } else {
        // 空地：蓝色基础色，且不放大
        cursor.classList.add("cursor-color-blue");
        cursor.classList.remove("cursor-hover");
      }
    };

    // 为了防止脑图节点里 stopPropagation，mousedown/up 用捕获阶段监听
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, true);
    window.addEventListener("mouseup", handleMouseUp, true);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
    };
  }, []);

  return (
    <>
      {/* 噪点纹理背景 */}
      <div className="noise-bg"></div>
      {/* 几何线条网格 */}
      <div className="geometry-bg"></div>
      {/* 自定义光标：中空蓝色圆环 */}
      <div id="custom-cursor"></div>
    </>
  );
}
