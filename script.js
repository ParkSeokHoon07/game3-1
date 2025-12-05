const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const highEl = document.getElementById("high");
const restartBtn = document.getElementById("restart");
const pauseBtn = document.getElementById("pause");
const ctx = board.getContext("2d");
const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
const GRID = 20;
let sizePx = 400;
function fitCanvas() {
  const rect = board.parentElement.getBoundingClientRect();
  const w = rect.width || board.parentElement.clientWidth || 400;
  sizePx = Math.floor(Math.max(240, Math.min(w - 24, 520)));
  board.width = sizePx * DPR;
  board.height = sizePx * DPR;
  board.style.width = sizePx + "px";
  board.style.height = sizePx + "px";
}
fitCanvas();
window.addEventListener("resize", fitCanvas);
let timer = null;
let intervalMs = 120;
let running = false;
let paused = false;
let score = 0;
let high = Number(localStorage.getItem("snake_high_score") || 0);
highEl.textContent = String(high);
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let apple = { x: 0, y: 0 };
function rnd(max) { return Math.floor(Math.random() * max); }
function eq(a, b) { return a.x === b.x && a.y === b.y; }
function spawnApple() {
  while (true) {
    const p = { x: rnd(GRID), y: rnd(GRID) };
    if (!snake.some(s => eq(s, p))) { apple = p; return; }
  }
}
function reset() {
  score = 0; scoreEl.textContent = "0";
  intervalMs = 120;
  dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
  const cx = Math.floor(GRID / 2);
  snake = [ { x: cx - 1, y: cx }, { x: cx, y: cx } ];
  spawnApple();
  paused = false; pauseBtn.textContent = "일시정지";
}
function tick() {
  if (!running || paused) return;
  dir = nextDir;
  const head = snake[snake.length - 1];
  const nh = { x: head.x + dir.x, y: head.y + dir.y };
  if (nh.x < 0 || nh.y < 0 || nh.x >= GRID || nh.y >= GRID) { gameOver(); return; }
  if (snake.some(s => eq(s, nh))) { gameOver(); return; }
  snake.push(nh);
  if (eq(nh, apple)) {
    score += 1; scoreEl.textContent = String(score);
    if (score % 4 === 0) intervalMs = Math.max(60, intervalMs - 6);
    spawnApple();
  } else {
    snake.shift();
  }
  draw();
}
function draw() {
  const cs = Math.floor(board.width / GRID);
  ctx.fillStyle = "#0b0e1a";
  ctx.fillRect(0, 0, board.width, board.height);
  ctx.fillStyle = "#e34b4b";
  ctx.fillRect(apple.x * cs, apple.y * cs, cs, cs);
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === snake.length - 1 ? "#59d887" : "#36b373";
    const s = snake[i];
    ctx.fillRect(s.x * cs, s.y * cs, cs, cs);
  }
}
function gameOver() {
  running = false; clearInterval(timer); timer = null;
  if (score > high) { high = score; localStorage.setItem("snake_high_score", String(high)); highEl.textContent = String(high); }
  ctx.fillStyle = "#00000088";
  ctx.fillRect(0, 0, board.width, board.height);
  ctx.fillStyle = "#e6e8f0";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `${24 * DPR}px system-ui`;
  ctx.fillText("게임 오버", board.width / 2, board.height / 2 - 20 * DPR);
  ctx.font = `${16 * DPR}px system-ui`;
  ctx.fillText("다시 시작을 누르세요", board.width / 2, board.height / 2 + 12 * DPR);
}
function start() {
  reset(); draw();
  running = true;
  clearInterval(timer);
  timer = setInterval(() => tick(), intervalMs);
}
restartBtn.addEventListener("click", () => { start(); });
pauseBtn.addEventListener("click", () => {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "재개" : "일시정지";
});
document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (k === " ") { e.preventDefault(); if (running) pauseBtn.click(); return; }
  if (k === "enter") { e.preventDefault(); restartBtn.click(); return; }
  if (paused) return;
  if ((k === "arrowup" || k === "w") && dir.y !== 1) nextDir = { x: 0, y: -1 };
  else if ((k === "arrowdown" || k === "s") && dir.y !== -1) nextDir = { x: 0, y: 1 };
  else if ((k === "arrowleft" || k === "a") && dir.x !== 1) nextDir = { x: -1, y: 0 };
  else if ((k === "arrowright" || k === "d") && dir.x !== -1) nextDir = { x: 1, y: 0 };
});
document.querySelectorAll(".touch button").forEach(b => {
  b.addEventListener("click", () => {
    const d = b.getAttribute("data-dir");
    if (paused) return;
    if (d === "up" && dir.y !== 1) nextDir = { x: 0, y: -1 };
    else if (d === "down" && dir.y !== -1) nextDir = { x: 0, y: 1 };
    else if (d === "left" && dir.x !== 1) nextDir = { x: -1, y: 0 };
    else if (d === "right" && dir.x !== -1) nextDir = { x: 1, y: 0 };
  });
});
let touchStart = null;
board.addEventListener("touchstart", e => {
  const t = e.changedTouches[0]; touchStart = { x: t.clientX, y: t.clientY };
});
board.addEventListener("touchend", e => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x; const dy = t.clientY - touchStart.y;
  const ax = Math.abs(dx); const ay = Math.abs(dy);
  if (ax + ay < 20) return;
  if (ax > ay) {
    if (dx < 0 && dir.x !== 1) nextDir = { x: -1, y: 0 };
    else if (dx > 0 && dir.x !== -1) nextDir = { x: 1, y: 0 };
  } else {
    if (dy < 0 && dir.y !== 1) nextDir = { x: 0, y: -1 };
    else if (dy > 0 && dir.y !== -1) nextDir = { x: 0, y: 1 };
  }
  touchStart = null;
});
window.addEventListener("load", start);
