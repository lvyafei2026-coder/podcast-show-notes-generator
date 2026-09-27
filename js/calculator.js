function t() { return (window.__i18n && window.__i18n.t) || {}; }

const SAMPLE_EN = `[00:00] Welcome back to The Creator Show. I'm your host, Sarah.
[00:42] Today we're talking about how to launch a podcast from scratch, even if you have zero audience.
[02:15] The first thing most people get wrong is they spend weeks on the logo and website before they ever record an episode.
[04:30] My advice: record episode one this week. Your first 10 episodes are practice.
[08:52] Here's the gear I actually recommend for beginners. A dynamic USB mic under $100 is more than enough.
[12:18] Editing is where most people burn out. Don't over-edit. Cut the ums, keep the personality.
[16:45] For distribution, start with Spotify and Apple Podcasts. Everything else comes later.
[22:10] The biggest growth lever is guest swaps with other small podcasts in your niche.
[28:30] Let's talk monetization. You don't need 10,000 downloads to make money. 500 true fans is enough.
[34:15] Three things to remember: consistency beats perfection, guests accelerate growth, and your audience wants you to succeed.
[38:00] Next week we're talking to a guest who grew her show to 50,000 downloads in 6 months. See you then.`;

const SAMPLE_ZH = `[00:00] 欢迎回到《创作者播客》，我是主持人 Sarah。
[00:42] 今天我们来聊聊如何从零开始做一档播客，即使你完全没有听众。
[02:15] 大多数人的第一个错误是：在录第一集之前花了好几周做 logo 和网站。
[04:30] 我的建议：这周就录第一集。你的前 10 集都是练习。
[08:52] 以下是我真正推荐的入门设备。一支 100 美元以下的动圈 USB 麦克风就完全够用。
[12:18] 剪辑是大多数人放弃的环节。不要过度剪辑。去掉"嗯"就行，保留个性。
[16:45] 分发方面，先从 Spotify 和 Apple Podcasts 开始。其他平台以后再说。
[22:10] 最大的增长杠杆是跟同领域其他小播客互换嘉宾。
[28:30] 来聊聊变现。你不需要 1 万次下载才能赚钱。500 个真正的粉丝就够了。
[34:15] 记住三件事：坚持胜过完美，嘉宾加速增长，你的听众希望你成功。
[38:00] 下周我们邀请一位嘉宾，她在 6 个月内把节目做到了 5 万次下载。下周见。`;

function loadSample() {
  const lang = (window.__i18n && window.__i18n.lang) || 'en';
  document.getElementById('transcript').value = lang === 'zh' ? SAMPLE_ZH : SAMPLE_EN;
}

function parseTranscript(text, hasTimestamps) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const segments = [];

  if (hasTimestamps) {
    for (const line of lines) {
      // Match [HH:MM], [MM:SS], HH:MM —, HH:MM:, etc.
      const m = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*[—\-:]*\s*(.*)$/);
      if (m) {
        segments.push({ time: m[1], text: m[2].trim() });
      } else if (segments.length > 0) {
        // Continuation of previous segment
        segments[segments.length - 1].text += ' ' + line;
      }
    }
  } else {
    // Plain transcript: split into chunks of ~3 sentences
    const sentences = text.split(/(?<=[.!?。！？])\s+/).filter(s => s.trim().length > 0);
    const chunkSize = 3;
    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join(' ');
      const time = formatTime(i * 45); // assume ~45s per 3 sentences
      segments.push({ time, text: chunk });
    }
  }

  return segments;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function extractKeywords(segment) {
  // Extract capitalized words and noun phrases as rough keywords
  const text = segment.text;
  const matches = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];
  return matches.slice(0, 2).join(' ');
}

function titleForSegment(seg, idx, total) {
  const tr = t();
  if (idx === 0) return tr.chapterIntro || 'Introduction';
  if (idx === total - 1) return tr.chapterOutro || 'Closing thoughts';
  // Use first 6-8 meaningful words as the title
  const words = seg.text.split(/\s+/).filter(w => w.length > 0);
  let title = words.slice(0, 7).join(' ');
  title = title.replace(/[.,;:!?。，、；：！？]+$/, '');
  if (title.length > 60) title = title.slice(0, 57) + '...';
  return title;
}

function summariseSegment(seg) {
  const sentences = seg.text.split(/(?<=[.!?。！？])\s+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, 2).join(' ').slice(0, 200);
}

function extractQuotes(segments) {
  const quotes = [];
  for (const seg of segments) {
    const sentences = seg.text.split(/(?<=[.!?。！？])\s+/).filter(s => s.trim().length > 20 && s.trim().length < 180);
    for (const s of sentences) {
      if (/[0-9]|advice|remember|tip|rule|important|关键|建议|记住|第一|最好/.test(s.toLowerCase())) {
        quotes.push({ time: seg.time, text: s.trim() });
        if (quotes.length >= 3) return quotes;
      }
    }
  }
  // fallback: longest sentences
  const all = segments.flatMap(s => s.text.split(/(?<=[.!?。！？])\s+/).map(tx => ({ time: s.time, text: tx.trim() })));
  return all.filter(q => q.text.length > 30 && q.text.length < 200).slice(0, 3);
}

function generate() {
  const tr = t();
  const title = document.getElementById('episodeTitle').value.trim() || 'Untitled episode';
  const mode = document.getElementById('inputMode').value;
  const transcript = document.getElementById('transcript').value.trim();

  if (!transcript) {
    alert(tr.alertEmpty || 'Please paste a transcript first.');
    return;
  }

  const segments = parseTranscript(transcript, mode === 'timestamped');
  if (segments.length === 0) {
    alert(tr.alertEmpty || 'Please paste a transcript first.');
    return;
  }

  const totalTime = segments[segments.length - 1].time;

  const lines = [];
  lines.push('# ' + title);
  lines.push('');

  // Summary
  const firstSeg = segments[0];
  const longest = segments.reduce((a, b) => a.text.length > b.text.length ? a : b, segments[0]);
  lines.push('## ' + (tr.summaryHeading || 'Episode Summary'));
  lines.push(summariseSegment(longest));
  lines.push('');

  // Chapters
  lines.push('## ' + (tr.chaptersHeading || 'Chapters'));
  segments.forEach((seg, i) => {
    const chapTitle = titleForSegment(seg, i, segments.length);
    lines.push(seg.time + ' — ' + chapTitle);
  });
  lines.push('');

  // Key takeaways
  lines.push('## ' + (tr.takeawaysHeading || 'Key Takeaways'));
  const takeaways = segments.slice(1, Math.min(6, segments.length - 1)).map(seg => {
    return '- ' + summariseSegment(seg).slice(0, 140);
  });
  takeaways.forEach(t => lines.push(t));
  lines.push('');

  // Social snippets
  const quotes = extractQuotes(segments);
  if (quotes.length > 0) {
    lines.push('## ' + (tr.snippetsHeading || 'Shareable Quotes'));
    quotes.forEach(q => {
      lines.push('> "' + q.text + '"');
      lines.push('  — ' + q.time);
      lines.push('');
    });
  }

  // Footer
  lines.push('---');
  lines.push((tr.footerNote || 'Episode length:') + ' ' + totalTime + ' · ' + segments.length + ' ' + (tr.segmentsWord || 'segments'));

  const notes = lines.join('\n');
  document.getElementById('notesBody').textContent = notes;
  document.getElementById('outputMeta').textContent = segments.length + ' ' + (tr.segmentsWord || 'segments') + ' · ' + totalTime;

  document.getElementById('result').classList.add('show');
}

function copyNotes() {
  const text = document.getElementById('notesBody').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const el = document.getElementById('copyCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy:', text); });
}

function buildShareUrl() {
  const params = new URLSearchParams();
  params.set('title', document.getElementById('episodeTitle').value);
  const t = document.getElementById('transcript').value;
  if (t.length < 2000) params.set('t', t);
  const base = window.location.origin + window.location.pathname;
  return base + '?' + params.toString();
}

function copyShareLink() {
  const url = buildShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById('shareCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy:', url); });
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('title')) document.getElementById('episodeTitle').value = params.get('title');
  if (params.has('t')) document.getElementById('transcript').value = params.get('t');
  if (params.has('t') || params.has('title')) generate();
}

window.generate = generate;
window.loadSample = loadSample;
window.copyNotes = copyNotes;
window.copyShareLink = copyShareLink;
window.readUrlParams = readUrlParams;

document.addEventListener('DOMContentLoaded', function() {
  readUrlParams();
});