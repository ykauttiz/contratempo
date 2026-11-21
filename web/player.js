"use strict";
const $ = id => document.getElementById(id);
const score = JSON.parse($("score").textContent);
const audio = $("audio");
const past = [], future = [];
let selected = -2, buttons = [], localUrl, pointA = null, pointB = null, importId = 0;
function tell(message) { $("status").textContent = message; }
function stamp(seconds, precise = false) {
  const ms = Math.round(seconds * 1000);
  return String(Math.floor(ms / 60000)).padStart(2, "0") + ":" +
    String(Math.floor(ms / 1000) % 60).padStart(2, "0") +
    (precise ? "." + String(ms % 1000).padStart(3, "0") : "");
}
function serialize() {
  return score.lines.map(([at, line]) => "[" + stamp(at, true) + "]" + line).join("\n") + "\n";
}
function parseLrc(source, extra) {
  source = source.replace(/^\uFEFF/, "");
  const offset = Number(source.match(/^\[offset:([+-]?\d+)\][ \t]*\r?$/im)?.[1] || 0) + extra;
  if (!Number.isSafeInteger(offset)) throw Error("Informe um ajuste inteiro em milissegundos.");
  const groups = new Map();
  let count = 0;
  for (const raw of source.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/)) {
    const line = raw.trimStart();
    const prefix = line.match(/^(?:\[\d+:[0-5]\d(?:[.:]\d{1,3})?\])+/);
    if (!prefix) continue;
    const lyric = line.slice(prefix[0].length).trim();
    for (const m of prefix[0].matchAll(/\[(\d+):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)) {
      const at = Number(m[1]) * 60000 + Number(m[2]) * 1000 + Number((m[3] || "").padEnd(3, "0")) - offset;
      if (!Number.isSafeInteger(at) || ++count > 10000) throw Error("Use até 10 mil marcações com tempos válidos.");
      const key = Math.max(0, at);
      if (!groups.has(key)) groups.set(key, []);
      if (lyric) groups.get(key).push(lyric);
    }
  }
  if (!groups.size) throw Error("Nenhum verso com tempo válido. Use [mm:ss.mmm] no começo da linha.");
  return Array.from(groups).sort(([a], [b]) => a - b).map(([ms, parts]) => [ms / 1000, parts.join(" / ")]);
}
function render() {
  let lo = 0, hi = score.lines.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (score.lines[mid][0] <= audio.currentTime) lo = mid + 1;
    else hi = mid;
  }
  const index = lo - 1;
  if (index === selected) return;
  buttons[selected]?.removeAttribute("aria-current");
  buttons[index]?.setAttribute("aria-current", "true");
  $("current").textContent = index < 0 ? "Introdução" : score.lines[index][1] || "Pausa";
  const next = score.lines[index + 1]?.[1];
  $("next").textContent = next ? "A seguir · " + next : "";
  selected = index;
}
function build() {
  $("title").textContent = score.title;
  const total = score.lines.filter(([, line]) => line).length;
  $("track-info").textContent = total + (total === 1 ? " verso sincronizado" : " versos sincronizados");
  const fragment = document.createDocumentFragment();
  buttons = score.lines.map(([at, line], index) => {
    const row = document.createElement("li"), button = document.createElement("button");
    const time = document.createElement("time");
    time.textContent = stamp(at, at % 1 !== 0);
    button.append(time, line || "Pausa");
    button.onclick = () => {
      if (!audio.readyState) return tell("Escolha um áudio e aguarde o carregamento.");
      audio.currentTime = Math.min(audio.duration, at);
      render();
    };
    button.onkeydown = event => {
      const dest = {ArrowDown:index + 1, ArrowUp:index - 1, Home:0, End:buttons.length - 1}[event.key];
      if (dest === undefined) return;
      event.preventDefault();
      buttons[Math.max(0, Math.min(buttons.length - 1, dest))].focus();
    };
    row.append(button); fragment.append(row);
    return button;
  });
  $("lines").replaceChildren(fragment);
  const options = score.lines.map(([at, line], index) => new Option(stamp(at, true) + " · " + (line || "Pausa"), index));
  $("cue").replaceChildren(...options);
  $("editor").value = serialize();
  $("offset").value = "0";
  selected = -2;
  render();
}
function updateLoop() {
  $("clear").disabled = pointA === null;
  $("range").textContent = pointA === null ? "Marque o início e depois o fim durante o ensaio." :
    pointB === null ? "Início em " + stamp(pointA, true) + ". Escolha o fim." :
    "Repetindo de " + stamp(pointA, true) + " até " + stamp(pointB, true) + ".";
}
$("mark-a").onclick = () => {
  if (!audio.readyState) return tell("Carregue um áudio primeiro.");
  pointA = audio.currentTime; pointB = null; updateLoop(); tell($("range").textContent);
};
$("mark-b").onclick = () => {
  if (pointA === null || audio.currentTime - pointA < 0.25) return tell("Marque A e avance pelo menos 0,25 s antes de marcar B.");
  pointB = audio.currentTime; audio.currentTime = pointA; updateLoop(); tell($("range").textContent);
};
function clearLoop() { pointA = pointB = null; updateLoop(); }
$("clear").onclick = () => { clearLoop(); tell("Repetição desligada."); };
function tick() {
  if (pointB !== null && !audio.paused && audio.currentTime >= pointB) audio.currentTime = pointA;
  render();
}
let frame = 0;
function animate() { tick(); if (!audio.paused) frame = requestAnimationFrame(animate); }
audio.onplay = () => { document.body.classList.add("playing"); cancelAnimationFrame(frame); animate(); };
audio.onpause = () => { document.body.classList.remove("playing"); cancelAnimationFrame(frame); };
audio.onended = () => {
  if (pointB !== null) { audio.currentTime = pointA; audio.play().catch(() => tell("Pressione play para continuar.")); }
};
audio.ontimeupdate = tick;
audio.onseeked = render;
audio.onloadedmetadata = () => { audio.playbackRate = Number($("speed").value); render(); };
audio.onerror = () => tell("Não foi possível abrir o áudio. Tente outro arquivo.");
$("pitch-control").hidden = !("preservesPitch" in audio);
$("pitch").onchange = () => { audio.preservesPitch = $("pitch").value === "preserve"; };
$("speed").onchange = () => { audio.playbackRate = Number($("speed").value); };
function loadAudio(file) {
  if (!file) return;
  clearLoop();
  if (localUrl) URL.revokeObjectURL(localUrl);
  localUrl = URL.createObjectURL(file); audio.src = localUrl;
  tell("Gravação selecionada · " + file.name);
};
$("upload").onchange = event => loadAudio(event.target.files[0]);
async function loadLyrics(file) {
  const id = ++importId;
  if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw Error("Use uma letra de até 1 MB.");
    const source = new TextDecoder("utf-8", {fatal:true}).decode(await file.arrayBuffer());
    if (id !== importId) return;
    const lines = parseLrc(source, 0);
    past.length = future.length = 0; historyButtons();
    score.lines = lines; score.title = source.match(/^\[ti:([^\]\r\n]+)\]/im)?.[1] || file.name.replace(/\.lrc$/i, "");
    build(); clearLoop(); tell("Letra carregada · " + file.name);
  } catch (err) { if (id === importId) tell(err instanceof TypeError ? "Salve a letra em UTF-8 e tente novamente." : err.message); }
};
$("lrc").onchange = event => loadLyrics(event.target.files[0]);
const desk = document.querySelector(".workspace");
desk.ondragover = event => { event.preventDefault(); desk.classList.add("drag"); };
desk.ondragleave = () => desk.classList.remove("drag");
desk.ondrop = event => {
  event.preventDefault(); desk.classList.remove("drag");
  for (const file of event.dataTransfer.files) {
    if (/\.lrc$/i.test(file.name)) loadLyrics(file);
    else if (file.type.startsWith("audio/")) loadAudio(file);
    else tell("Arraste um arquivo LRC ou uma gravação de áudio.");
  }
};
$("apply").onclick = () => {
  try {
    if (!$("offset").validity.valid) throw Error("Use um número inteiro para o ajuste.");
    const lines = parseLrc($("editor").value, Number($("offset").value));
    remember(); score.lines = lines;
    ++importId; build(); tell("Letra aplicada. Baixe o LRC para guardar a edição.");
  } catch (err) { tell(err.message); }
};
function historyButtons() { $("undo").disabled = !past.length; $("redo").disabled = !future.length; }
function remember() {
  past.push(score.lines); if (past.length > 20) past.shift();
  future.length = 0; historyButtons();
}
function restore(from, to) {
  if (!from.length) return;
  to.push(score.lines); score.lines = from.pop(); build(); historyButtons();
}
$("undo").onclick = () => restore(past, future);
$("redo").onclick = () => restore(future, past);
$("tap").onclick = () => {
  if (!audio.readyState) return tell("Carregue um áudio primeiro.");
  const index = Number($("cue").value), at = Math.round(audio.currentTime * 1000) / 1000;
  if ((index > 0 && at <= score.lines[index - 1][0]) ||
      (index + 1 < score.lines.length && at >= score.lines[index + 1][0])) return tell("Marque o tempo entre o verso anterior e o seguinte.");
  remember();
  score.lines = score.lines.map((entry, i) => i === index ? [at, entry[1]] : entry);
  build(); $("cue").selectedIndex = Math.min(index + 1, score.lines.length - 1); tell("Tempo do verso atualizado.");
};
function togglePresentation() {
  const enabled = document.body.classList.toggle("present");
  $("present").textContent = enabled ? "Voltar ao ensaio" : "Apresentar";
  $("present").setAttribute("aria-pressed", String(enabled));
  $("present").focus();
}
$("present").onclick = togglePresentation;
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && document.body.classList.contains("present")) togglePresentation();
});
function captions(srt) {
  const clock = seconds => {
    const ms = Math.round(seconds * 1000), h = Math.floor(ms / 3600000);
    return String(h).padStart(2, "0") + ":" + stamp((ms % 3600000) / 1000, true).replace(".", srt ? "," : ".");
  };
  const blocks = [];
  score.lines.forEach(([at, line], i) => {
    if (!line) return;
    const end = score.lines[i + 1]?.[0] ?? at + 3;
    const text = srt ? line : line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    blocks.push((srt ? (blocks.length + 1) + "\n" : "") + clock(at) + " --> " + clock(end) + "\n" + text);
  });
  return (srt ? "" : "WEBVTT\n\n") + blocks.join("\n\n") + "\n";
}
$("save").onclick = () => {
  const format = $("format").value;
  const content = format === "LRC" ? serialize() : captions(format === "SRT");
  const url = URL.createObjectURL(new Blob([content], {type:"text/plain;charset=utf-8"}));
  const a = document.createElement("a"); a.href = url; a.download = score.title + "." + ({LRC:"lrc", SRT:"srt", WebVTT:"vtt"})[format]; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
if (score.audio) audio.src = score.audio;
else tell("Escolha a gravação correspondente a esta letra.");
build();
