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
function filterVerses() {
  const simplify = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
  const term = simplify($("verse-search").value.trim());
  let count = 0;
  buttons.forEach((button, index) => {
    const matches = !term || simplify(score.lines[index][1] || "Pausa").includes(term);
    button.parentElement.hidden = !matches;
    if (matches) count++;
  });
  $("verse-count").textContent = term ? (count ? count + " de " + buttons.length + " trechos" : "Nenhum trecho encontrado. Tente outra palavra.") : "";
}
$("verse-search").oninput = filterVerses;
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
      if (!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
      const visible = buttons.filter(item => !item.parentElement.hidden);
      const position = visible.indexOf(button);
      const dest = {ArrowDown:position + 1, ArrowUp:position - 1, Home:0, End:visible.length - 1}[event.key];
      event.preventDefault();
      visible[Math.max(0, Math.min(visible.length - 1, dest))].focus();
    };
    row.append(button); fragment.append(row);
    return button;
  });
  $("lines").replaceChildren(fragment);
  filterVerses();
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
$("verse-loop").onclick = () => {
  if (!audio.readyState || !Number.isFinite(audio.duration)) return tell("Carregue uma gravação primeiro.");
  render();
  const line = score.lines[selected];
  if (!line?.[1]) return tell("Selecione um verso para repetir.");
  const end = Math.min(score.lines[selected + 1]?.[0] ?? audio.duration, audio.duration);
  if (end - line[0] < 0.25) return tell("Este verso é curto demais para repetir. Marque um trecho maior com A e B.");
  pointA = line[0]; pointB = end; audio.currentTime = pointA;
  updateLoop(); tell($("range").textContent);
};
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
  if (!$("wave-box").hidden && audio.duration > 0) $("wave-seek").value = Math.round(audio.currentTime / audio.duration * 1000);
  if (pointB !== null && !audio.paused && audio.currentTime >= pointB) audio.currentTime = pointA;
  render();
}
let frame = 0, pendingSession = null;
function animate() { tick(); if (!audio.paused) frame = requestAnimationFrame(animate); }
audio.onplay = () => { document.body.classList.add("playing"); cancelAnimationFrame(frame); animate(); };
audio.onpause = () => { document.body.classList.remove("playing"); cancelAnimationFrame(frame); };
audio.onended = () => {
  if (pointB !== null) { audio.currentTime = pointA; audio.play().catch(() => tell("Pressione play para continuar.")); }
};
audio.ontimeupdate = tick;
audio.onseeked = render;
audio.onloadedmetadata = () => { if (pendingSession) restoreTransport(); audio.playbackRate = Number($("speed").value); render(); };
audio.onerror = () => tell("Não foi possível abrir o áudio. Tente outro arquivo.");
$("pitch-control").hidden = !("preservesPitch" in audio);
$("pitch").onchange = () => { audio.preservesPitch = $("pitch").value === "preserve"; };
$("speed").onchange = () => { audio.playbackRate = Number($("speed").value); };
function loadAudio(file) {
  if (!file) return;
  if (!pendingSession) clearLoop();
  if (localUrl) URL.revokeObjectURL(localUrl);
  activeAudioFile = file; resetWave();
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
    pendingSession = null; past.length = future.length = 0; historyButtons();
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
  if ($("editor").value !== serialize() || Number($("offset").value) !== 0) return tell("Aplique as mudanças da letra antes de marcar o tempo.");
  const index = Number($("cue").value), at = Math.round(audio.currentTime * 1000) / 1000;
  if ((index > 0 && at <= score.lines[index - 1][0]) ||
      (index + 1 < score.lines.length && at >= score.lines[index + 1][0])) return tell("Marque o tempo entre o verso anterior e o seguinte.");
  remember();
  score.lines = score.lines.map((entry, i) => i === index ? [at, entry[1]] : entry);
  build(); $("cue").selectedIndex = Math.min(index + 1, score.lines.length - 1); tell("Tempo do verso atualizado.");
};
function togglePresentation() {
  const enabled = document.body.classList.toggle("present");
  $("font-control").hidden = !enabled;
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

const sessionKey = "contratempo.session.v1";
function encodeSession() {
  return JSON.stringify({version:1, title:score.title, lyrics:serialize(), position:pendingSession?.position ?? audio.currentTime,
    speed:$("speed").value, pitch:$("pitch").value, a:pointA, b:pointB}, null, 2);
}
function restoreTransport() {
  const saved = pendingSession;
  if (!saved) return;
  audio.currentTime = Math.min(audio.duration, saved.position);
  if (pointA !== null && pointA >= audio.duration) clearLoop();
  if (pointB !== null && pointB > audio.duration) { pointB = null; updateLoop(); }
  pendingSession = null;
}
function openSession(raw) {
  const data = JSON.parse(raw);
  const validTime = value => Number.isFinite(value) && value >= 0;
  if (data?.version !== 1 || typeof data.title !== "string" || typeof data.lyrics !== "string" ||
      !validTime(data.position) || !Array.from($("speed").options).some(o => o.value === data.speed) ||
      !["preserve","vary"].includes(data.pitch) || !(data.a === null || validTime(data.a)) ||
      !(data.b === null || (validTime(data.b) && data.a !== null && data.b - data.a >= 0.25)))
    throw Error("Sessão inválida ou versão incompatível.");
  const lines = parseLrc(data.lyrics, 0);
  ++importId; past.length = future.length = 0; historyButtons();
  activeAudioFile = null; resetWave();
  audio.pause(); audio.removeAttribute("src"); audio.load();
  if (localUrl) { URL.revokeObjectURL(localUrl); localUrl = null; }
  $("upload").value = "";
  score.title = data.title; score.lines = lines;
  pendingSession = data; pointA = data.a; pointB = data.b;
  $("speed").value = data.speed; $("pitch").value = data.pitch;
  if ("preservesPitch" in audio) audio.preservesPitch = data.pitch === "preserve";
  build(); updateLoop(); tell("Sessão aberta. Selecione a gravação para retomar.");
}
try { $("resume").disabled = !localStorage.getItem(sessionKey); } catch { /* Standalone files may disable storage. */ }
$("keep").onclick = () => {
  try { localStorage.setItem(sessionKey, encodeSession()); $("resume").disabled = false; tell("Sessão guardada neste navegador."); }
  catch { tell("Armazenamento indisponível. Baixe a sessão em JSON."); }
};
$("resume").onclick = () => {
  try { openSession(localStorage.getItem(sessionKey)); } catch { tell("Não foi possível abrir a sessão guardada."); }
};
$("backup").onclick = () => {
  const url = URL.createObjectURL(new Blob([encodeSession()], {type:"application/json"}));
  const link = document.createElement("a"); link.href = url; link.download = score.title + ".json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("session-file").onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  const id = ++importId;
  try {
    if (file.size > 4 * 1024 * 1024) throw Error();
    const raw = await file.text(); if (id !== importId) return;
    openSession(raw);
  } catch { tell("Use uma sessão JSON válida do Contratempo de até 4 MB."); }
};

$("font").oninput = () => document.body.style.setProperty("--lyric-scale", Number($("font").value) / 100);
let waveVersion = 0, activeAudioFile = null;
function resetWave() {
  waveVersion++;
  $("wave-box").hidden = true; $("wave-load").disabled = false; $("wave-status").textContent = "";
}
$("wave-load").onclick = async () => {
  const id = ++waveVersion, file = activeAudioFile;
  if (!audio.readyState || !Number.isFinite(audio.duration)) return tell("Carregue uma gravação primeiro.");
  if (audio.duration > 300 || (file && file.size > 16 * 1024 * 1024)) return tell("A prévia da onda aceita até 5 minutos e 16 MB. O player continua disponível.");
  $("wave-load").disabled = true; $("wave-status").textContent = "Calculando a forma de onda…";
  let context;
  try {
    const buffer = file ? await file.arrayBuffer() : await (await fetch(score.audio)).arrayBuffer();
    if (id !== waveVersion) return;
    context = new AudioContext({sampleRate:16000});
    const decoded = await context.decodeAudioData(buffer);
    if (id !== waveVersion) return;
    const samples = decoded.getChannelData(0), canvas = $("wave"), pen = canvas.getContext("2d");
    pen.clearRect(0, 0, canvas.width, canvas.height);
    pen.strokeStyle = "#ffa58c"; pen.lineWidth = 2; pen.beginPath();
    const bars = 320, center = canvas.height / 2;
    for (let i = 0; i < bars; i++) {
      const start = Math.floor(i * samples.length / bars), end = Math.floor((i + 1) * samples.length / bars);
      let peak = 0;
      for (let j = start; j < end; j++) peak = Math.max(peak, Math.abs(samples[j]));
      const x = (i + 0.5) * canvas.width / bars, height = Math.max(1, peak * center);
      pen.moveTo(x, center - height); pen.lineTo(x, center + height);
    }
    pen.stroke(); $("wave-box").hidden = false; tick();
    $("wave-status").textContent = "Toque na onda ou use as setas para buscar.";
  } catch {
    if (id === waveVersion) { $("wave-load").disabled = false; $("wave-status").textContent = "Forma de onda indisponível para esta gravação."; }
  } finally { if (context) await context.close(); }
};
$("wave-seek").oninput = () => { if (audio.duration > 0) audio.currentTime = Number($("wave-seek").value) * audio.duration / 1000; };
