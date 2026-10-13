/**
 * ===================================================
 * KINETIC TEXT STUDIO – TYPESCRIPT ENGINE
 * Drives kinetic typography from 60 seconds up to 3 minutes.
 * Supports Auto-Duration & Auto-Pacing based on Text Length,
 * 6 Animation Styles, Custom Fonts, Yellow Glow Highlighting,
 * Play/Pause, Real-Time Speed Control, and Timeline Scrubbing.
 * ===================================================
 */

export interface SceneConfig {
  el: HTMLElement;
  start: number;
  end: number;
  glowAt: number | null;
}

export interface LetterItem {
  el: HTMLElement;
  start: number;
  end: number;
}

export interface CountItem {
  el: HTMLElement;
  start: number;
  end: number;
  to: number;
}

export interface ParsedScene {
  lines: string[];
  wordCount: number;
  duration?: number;
  start?: number;
  end?: number;
  glowAt?: number | null;
}

export type AnimationStyle = 'slide-up' | 'typewriter' | 'pop-zoom' | 'blur-focus' | 'flip-3d' | 'glitch';

export class KineticStudio {
  private appContainer: HTMLElement | null;
  private stage: HTMLElement;
  private scenesContainer: HTMLElement;
  private replayBtn: HTMLElement | null;
  private studioPanel: HTMLElement | null;
  private toggleBtn: HTMLElement | null;
  private closeBtn: HTMLElement | null;
  private scriptInput: HTMLTextAreaElement | null;
  private durationSlider: HTMLInputElement | null;
  private durationBadge: HTMLElement | null;
  private autoDurationBtn: HTMLElement | null;
  private autoPillBtn: HTMLElement | null;
  private scriptStatsBadge: HTMLElement | null;
  private animateBtn: HTMLElement | null;
  private resetBtn: HTMLElement | null;
  private highlightYellowBtn: HTMLElement | null;

  // Media Player Controls
  private playPauseBtn: HTMLElement | null;
  private playPauseIcon: HTMLElement | null;
  private playPauseText: HTMLElement | null;
  private timeDisplay: HTMLElement | null;
  private timelineBar: HTMLElement | null;
  private timelineWrap: HTMLElement | null;
  private timelineThumb: HTMLElement | null;
  private timelineTooltip: HTMLElement | null;
  private stepBackBtn: HTMLElement | null;
  private stepFwdBtn: HTMLElement | null;
  private customSpeedSlider: HTMLInputElement | null;
  private playerCustomSpeedBtn: HTMLElement | null;
  private playerCustomSpeedLabel: HTMLElement | null;
  private playerCustomSpeedPopover: HTMLElement | null;
  private playerSpeedRange: HTMLInputElement | null;
  private playerSpeedVal: HTMLElement | null;
  private isScrubbing: boolean = false;


  // Animation Engine State
  private sceneConfigs: SceneConfig[] = [];
  private letterTimeline: LetterItem[] = [];
  private countTimeline: CountItem[] = [];
  private totalDuration: number = 60;
  private currentPlaybackTime: number = 0;
  private lastTimestamp: number | null = null;
  private animationId: number | null = null;
  private isPaused: boolean = false;
  private playbackSpeed: number = 1.0;
  private isAutoDuration: boolean = true;
  private currentAnimationStyle: AnimationStyle = 'slide-up';
  private currentFont: string = 'Inter';
  private currentAspectRatio: string = '9:16';
  private aspectRatioBadge: HTMLElement | null;

  private readonly LETTER_SLIDE_PX: number = 28;
  private readonly LETTER_DURATION: number = 0.38;
  private readonly SCENE_FADE_OUT: number = 0.5;
  private readonly LOOP_FADE_OUT: number = 0.6;

  private readonly DEFAULT_MCP_SCRIPT: string = 
`MCP
ante enti?

Oka simple example tho
60 seconds lo
explain chestha!

MCP ante
Model
Context
Protocol`;

  constructor() {
    this.appContainer = document.querySelector('.app-container');
    this.stage = document.getElementById('stage') as HTMLElement;
    this.scenesContainer = document.getElementById('scenes-container') as HTMLElement || this.stage;
    this.replayBtn = document.getElementById('replay-btn');
    this.studioPanel = document.getElementById('studio-panel');
    this.toggleBtn = document.getElementById('toggle-studio-btn');
    this.closeBtn = document.getElementById('close-studio-btn');
    this.scriptInput = document.getElementById('script-input') as HTMLTextAreaElement | null;
    this.durationSlider = document.getElementById('duration-slider') as HTMLInputElement | null;
    this.durationBadge = document.getElementById('duration-badge');
    this.autoDurationBtn = document.getElementById('auto-duration-btn');
    this.autoPillBtn = document.getElementById('auto-pill-btn');
    this.scriptStatsBadge = document.getElementById('script-stats-badge');
    this.animateBtn = document.getElementById('animate-btn');
    this.resetBtn = document.getElementById('reset-preset-btn');
    this.highlightYellowBtn = document.getElementById('highlight-yellow-btn');

    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.playPauseIcon = document.getElementById('play-pause-icon');
    this.playPauseText = document.getElementById('play-pause-text');
    this.timeDisplay = document.getElementById('time-display');
    this.timelineBar = document.getElementById('timeline-bar');
    this.timelineWrap = document.getElementById('timeline-bar-wrap');
    this.timelineThumb = document.getElementById('timeline-thumb');
    this.timelineTooltip = document.getElementById('timeline-tooltip');
    this.stepBackBtn = document.getElementById('step-back-btn');
    this.stepFwdBtn = document.getElementById('step-fwd-btn');
    this.customSpeedSlider = document.getElementById('studio-custom-speed-slider') as HTMLInputElement | null;
    this.playerCustomSpeedBtn = document.getElementById('player-custom-speed-btn');
    this.playerCustomSpeedLabel = document.getElementById('player-custom-speed-label');
    this.playerCustomSpeedPopover = document.getElementById('custom-speed-popover');
    this.playerSpeedRange = document.getElementById('player-speed-range') as HTMLInputElement | null;
    this.playerSpeedVal = document.getElementById('player-speed-val');

    // Aspect Ratio Badge Element
    this.aspectRatioBadge = document.getElementById('aspect-ratio-badge');

    this.init();
  }

  private init(): void {
    if (!this.stage) return;

    this.bindEvents();
    this.loadSavedSettings();
    this.updateScriptStats();
    this.buildTimeline();
    this.autoShrinkLines();
    this.startAnimation();
  }

  public splitGraphemes(text: string): string[] {
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s: any) => s.segment);
    }
    return Array.from(text);
  }

  public autoShrinkLines(): void {
    const stageWidth = this.stage.clientWidth || 420;
    const maxWidth = Math.max(120, stageWidth - 64);

    this.stage.querySelectorAll<HTMLElement>('.scene .line').forEach((line) => {
      line.style.fontSize = '';
      const styleAttr = line.getAttribute('style') || '';
      const sizeMatch = styleAttr.match(/--size:\s*([0-9.]+)px/);
      let size = sizeMatch ? parseFloat(sizeMatch[1]) : 26;
      line.style.fontSize = `${size}px`;

      while (line.scrollWidth > maxWidth && size > 16) {
        size -= 1;
        line.style.fontSize = `${size}px`;
      }
    });
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * Calculates ideal reading duration and speed from text length
   */
  public calculateIdealDuration(rawText: string): { duration: number; words: number } {
    const cleanText = rawText.trim();
    if (!cleanText) return { duration: 15, words: 0 };

    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const paragraphs = cleanText.split(/\n\s*\n/).filter(Boolean).length;
    const counters = (cleanText.match(/\b\d+\b/g) || []).length;

    // Natural reading pace: ~0.42s per word + 0.6s per scene pause + 1s per counter
    const rawCalc = Math.round(words * 0.42 + paragraphs * 0.6 + counters * 1.0);
    const duration = Math.min(180, Math.max(15, rawCalc));

    return { duration, words };
  }

  private updateScriptStats(): void {
    const text = this.scriptInput?.value || '';
    const { duration, words } = this.calculateIdealDuration(text);

    if (this.scriptStatsBadge) {
      this.scriptStatsBadge.textContent = `${words} words • ~${duration}s ideal`;
    }

    if (this.isAutoDuration) {
      if (this.durationSlider) {
        this.durationSlider.value = duration.toString();
      }
      if (this.durationBadge) {
        this.durationBadge.textContent = `${duration}s (Auto: ${words}w)`;
      }
      this.autoDurationBtn?.classList.add('active');
      this.autoPillBtn?.classList.add('active');
    }
  }

  private chunkLine(text: string): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 4) return [text.trim()];

    const lines: string[] = [];
    let current: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      current.push(word);

      const hasPunctuation = /[.?!…,:;]$/.test(word);
      const isArrow = word === '->' || word === '→';
      const shouldBreak = (current.length >= 3 && hasPunctuation) || isArrow || current.length >= 4;

      if (shouldBreak && i < words.length - 1) {
        lines.push(current.join(' '));
        current = [];
      }
    }

    if (current.length > 0) {
      if (lines.length > 0 && current.length <= 1) {
        lines[lines.length - 1] += ' ' + current.join(' ');
      } else {
        lines.push(current.join(' '));
      }
    }

    return lines;
  }

  /**
   * Parse script with automatic scene timing and speed adaptation
   */
  public parseScript(rawText: string, targetDuration: number): string {
    const rawParagraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (rawParagraphs.length === 0) return '';

    const sceneBlocks: string[][] = [];

    rawParagraphs.forEach((para) => {
      const rawLines = para.split('\n').map((l) => l.trim()).filter(Boolean);
      let sceneLines: string[] = [];
      let sceneWordCount = 0;

      rawLines.forEach((rawLine) => {
        const chunks = this.chunkLine(rawLine);
        chunks.forEach((chunk) => {
          const chunkWords = chunk.split(/\s+/).filter(Boolean).length;
          if ((sceneLines.length >= 3 || sceneWordCount + chunkWords > 14) && sceneLines.length > 0) {
            sceneBlocks.push(sceneLines);
            sceneLines = [chunk];
            sceneWordCount = chunkWords;
          } else {
            sceneLines.push(chunk);
            sceneWordCount += chunkWords;
          }
        });
      });

      if (sceneLines.length > 0) {
        sceneBlocks.push(sceneLines);
      }
    });

    const parsedScenes: ParsedScene[] = sceneBlocks.map((lines) => {
      const words = lines.join(' ').split(/\s+/).filter(Boolean).length;
      return {
        lines,
        wordCount: Math.max(1, words),
      };
    });

    const totalWords = parsedScenes.reduce((sum, s) => sum + s.wordCount, 0);
    const numScenes = parsedScenes.length;

    // Use auto-calculated duration if Auto mode is active
    let effectiveDuration = targetDuration;
    if (this.isAutoDuration) {
      effectiveDuration = this.calculateIdealDuration(rawText).duration;
    }

    const transitionLoss = (numScenes - 1) * 0.45;
    const activeAnimationTime = Math.max(numScenes * 2.5, effectiveDuration - transitionLoss);

    let currentTime = 0;

    const htmlOutput = parsedScenes.map((scene) => {
      const proportion = scene.wordCount / totalWords;
      const sceneDuration = Math.max(2.4, parseFloat((proportion * activeAnimationTime).toFixed(1)));
      const startTime = parseFloat(currentTime.toFixed(1));
      const endTime = parseFloat((startTime + sceneDuration).toFixed(1));

      currentTime = endTime + 0.45;

      const hasBigInitials = scene.lines.length >= 3 && scene.lines.every((l, i) => i === 0 || /^[A-Z][a-z]+$/.test(l));
      const glowAt = hasBigInitials ? parseFloat((startTime + sceneDuration * 0.75).toFixed(1)) : null;

      const linesHtml = scene.lines.map((lineText, lineIdx) => {
        return this.formatLine(lineText, lineIdx, scene.lines.length, hasBigInitials);
      }).join('\n    ');

      const glowAttr = glowAt ? ` data-glow-at="${glowAt}"` : '';
      return `<section class="scene" data-start="${startTime}" data-end="${endTime}"${glowAttr}>\n    ${linesHtml}\n  </section>`;
    }).join('\n\n  ');

    return htmlOutput;
  }

  private formatLine(line: string, index: number, totalInScene: number, hasBigInitials: boolean): string {
    let processed = line;
    let colorClass = 'white';
    let sizePx = 28;

    const words = line.split(/\s+/).filter(Boolean);

    if (totalInScene === 1) {
      sizePx = words.length <= 2 ? 60 : 34;
    } else if (index === 0) {
      sizePx = words.length <= 2 ? 46 : (words.length <= 4 ? 32 : 26);
    } else {
      sizePx = words.length <= 3 ? 30 : 24;
    }

    if (line.trim().startsWith('#')) {
      colorClass = 'cyan';
      sizePx = 20;
      return `<p class="line ${colorClass}" style="--size:${sizePx}px">${line}</p>`;
    }

    processed = processed.replace(/\*([^*]+)\*/g, '<span class="glow-yellow">$1</span>');

    if (/^[A-Z0-9\s]{2,10}$/.test(line.trim())) {
      colorClass = 'yellow';
      sizePx = Math.min(68, Math.max(38, Math.floor(360 / Math.max(4, line.length))));
      return `<p class="line ${colorClass}" style="--size:${sizePx}px" data-spacing="2">${line}</p>`;
    }

    if (hasBigInitials && index > 0 && /^[A-Z][a-zA-Z0-9]+$/.test(line)) {
      const initial = line[0];
      const rest = line.slice(1);
      const initialColors = ['yellow', 'cyan', 'purple'];
      const initColor = initialColors[(index - 1) % initialColors.length];
      const delay = (index * 1.1).toFixed(1);
      return `<p class="line white big-initial" style="--size:36px" data-delay="${delay}"><span class="initial ${initColor}">${initial}</span>${rest}</p>`;
    }

    processed = processed.replace(/\b(\d+)\b/g, (match) => {
      const countSize = Math.max(44, Math.min(76, sizePx * 1.5));
      return `<span class="count purple" data-to="${match}" style="--size:${countSize}px">${match}</span>`;
    });

    processed = processed.replace(/\?/g, '<span class="cyan">?</span>');

    return `<p class="line ${colorClass}" style="--size:${sizePx}px">${processed}</p>`;
  }

  private processNode(node: Node, letterList: HTMLElement[], countList: HTMLElement[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentNode) return;
      const text = node.textContent;
      if (!text) return;
      const graphemes = this.splitGraphemes(text);
      const fragment = document.createDocumentFragment();

      for (const char of graphemes) {
        const span = document.createElement('span');
        span.classList.add('letter');
        if (char === ' ') {
          span.textContent = '\u00A0';
          span.classList.add('letter-space');
        } else {
          span.textContent = char;
        }
        fragment.appendChild(span);
        letterList.push(span);
      }
      if (node.parentNode) {
        node.parentNode.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.classList.contains('count')) {
        countList.push(el);
        return;
      }
      const children = Array.from(el.childNodes);
      for (const child of children) {
        this.processNode(child, letterList, countList);
      }
    }
  }

  public buildTimeline(): void {
    this.sceneConfigs = [];
    this.letterTimeline = [];
    this.countTimeline = [];

    const scenes = Array.from(this.stage.querySelectorAll<HTMLElement>('.scene'));
    let maxSceneEnd = 0;

    scenes.forEach((sceneEl) => {
      const sceneStart = parseFloat(sceneEl.dataset.start || '0');
      const sceneEnd = parseFloat(sceneEl.dataset.end || '4');
      const glowAt = sceneEl.dataset.glowAt ? parseFloat(sceneEl.dataset.glowAt) : null;

      if (sceneEnd > maxSceneEnd) maxSceneEnd = sceneEnd;

      const lines = Array.from(sceneEl.querySelectorAll<HTMLElement>('.line'));
      const lineCount = lines.length;
      const availableTime = Math.max(0.6, (sceneEnd - sceneStart) - 0.7);

      this.sceneConfigs.push({
        el: sceneEl,
        start: sceneStart,
        end: sceneEnd,
        glowAt,
      });

      lines.forEach((lineEl, lineIdx) => {
        if (lineEl.dataset.spacing) {
          lineEl.style.letterSpacing = `${lineEl.dataset.spacing}px`;
        }

        const lineLetters: HTMLElement[] = [];
        const lineCounts: HTMLElement[] = [];

        Array.from(lineEl.childNodes).forEach((child) => {
          this.processNode(child, lineLetters, lineCounts);
        });

        let lineStart: number;
        if (lineEl.dataset.delay !== undefined) {
          lineStart = sceneStart + parseFloat(lineEl.dataset.delay);
        } else if (lineCount === 1) {
          lineStart = sceneStart + 0.2;
        } else {
          lineStart = sceneStart + 0.15 + (lineIdx * (availableTime / lineCount));
        }

        const lineAvailable = Math.max(0.4, (sceneEnd - lineStart) - 0.4);
        const stagger = Math.min(0.065, Math.max(0.035, (lineAvailable * 0.55) / Math.max(1, lineLetters.length)));
        const letterBaseTime = lineCounts.length > 0 ? lineStart + 0.35 : lineStart;

        let letterOffset = 0;
        lineLetters.forEach((span) => {
          if (span.classList.contains('letter-space')) {
            span.style.opacity = '1';
            span.style.transform = 'none';
            return;
          }

          this.letterTimeline.push({
            el: span,
            start: letterBaseTime + letterOffset,
            end: letterBaseTime + letterOffset + this.LETTER_DURATION,
          });
          letterOffset += stagger;
        });

        lineCounts.forEach((countEl) => {
          const targetVal = parseFloat(countEl.dataset.to || '60');
          this.countTimeline.push({
            el: countEl,
            start: lineStart,
            end: Math.min(sceneEnd - 0.4, lineStart + 2.0),
            to: targetVal,
          });
        });
      });
    });

    this.totalDuration = maxSceneEnd + this.LOOP_FADE_OUT;
  }

  private tick = (timestamp: number): void => {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }

    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (!this.isPaused) {
      this.currentPlaybackTime += delta * this.playbackSpeed;
    }

    if (this.currentPlaybackTime >= this.totalDuration) {
      this.currentPlaybackTime = 0;
      this.resetAll();
    }

    this.renderFrame(this.currentPlaybackTime);
    this.updatePlayerControls();

    this.animationId = requestAnimationFrame(this.tick);
  };

  public renderFrame(elapsed: number): void {
    this.updateScenes(elapsed);
    this.updateLetters(elapsed);
    this.updateCounters(elapsed);

    const loopFadeStart = this.totalDuration - this.LOOP_FADE_OUT;
    if (elapsed >= loopFadeStart && elapsed < this.totalDuration) {
      const fadeProgress = (elapsed - loopFadeStart) / this.LOOP_FADE_OUT;
      this.stage.style.opacity = (1 - fadeProgress).toFixed(3);
    } else {
      this.stage.style.opacity = '1';
    }
  }

  private updateScenes(elapsed: number): void {
    for (const sc of this.sceneConfigs) {
      const fadeInEnd = sc.start + 0.3;
      const fadeOutStart = sc.end - this.SCENE_FADE_OUT;

      if (elapsed < sc.start) {
        sc.el.style.opacity = '0';
        sc.el.style.pointerEvents = 'none';
      } else if (elapsed < fadeInEnd) {
        sc.el.style.opacity = ((elapsed - sc.start) / 0.3).toFixed(3);
        sc.el.style.pointerEvents = 'auto';
      } else if (elapsed < fadeOutStart) {
        sc.el.style.opacity = '1';
        sc.el.style.pointerEvents = 'auto';
      } else if (elapsed < sc.end) {
        sc.el.style.opacity = (1 - (elapsed - fadeOutStart) / this.SCENE_FADE_OUT).toFixed(3);
        sc.el.style.pointerEvents = 'none';
      } else {
        sc.el.style.opacity = '0';
        sc.el.style.pointerEvents = 'none';
      }

      if (sc.glowAt !== null) {
        const initials = sc.el.querySelectorAll('.initial');
        if (elapsed >= sc.glowAt && elapsed < sc.end) {
          initials.forEach((init) => {
            if (!init.classList.contains('glow')) {
              init.classList.add('glow', 'pulse');
            }
          });
        } else {
          initials.forEach((init) => {
            init.classList.remove('glow', 'pulse');
          });
        }
      }
    }
  }

  private updateLetters(elapsed: number): void {
    const style = this.currentAnimationStyle;

    for (const item of this.letterTimeline) {
      if (elapsed < item.start) {
        item.el.style.opacity = '0';
        item.el.style.transform = style === 'flip-3d' ? 'perspective(600px) rotateX(-90deg)' : (style === 'pop-zoom' ? 'scale(0.2)' : `translateY(${this.LETTER_SLIDE_PX}px)`);
        item.el.style.filter = style === 'blur-focus' ? 'blur(16px)' : 'none';
        item.el.style.textShadow = '';
      } else if (elapsed < item.end) {
        const normTime = (elapsed - item.start) / this.LETTER_DURATION;

        switch (style) {
          case 'typewriter': {
            item.el.style.opacity = '1';
            item.el.style.transform = 'none';
            item.el.style.filter = 'none';
            break;
          }

          case 'pop-zoom': {
            const t = Math.min(1, normTime);
            const scale = Math.max(0.1, this.easeOutBack(t));
            item.el.style.opacity = t >= 0.1 ? '1' : '0';
            item.el.style.transform = `scale(${scale.toFixed(3)})`;
            item.el.style.filter = 'none';
            break;
          }

          case 'blur-focus': {
            const t = this.easeOutCubic(normTime);
            const blur = (1 - t) * 16;
            item.el.style.opacity = t.toFixed(3);
            item.el.style.transform = `scale(${(1.15 - 0.15 * t).toFixed(3)})`;
            item.el.style.filter = `blur(${blur.toFixed(1)}px)`;
            break;
          }

          case 'flip-3d': {
            const t = this.easeOutCubic(normTime);
            const rotX = -90 * (1 - t);
            const y = 16 * (1 - t);
            item.el.style.opacity = t.toFixed(3);
            item.el.style.transform = `perspective(600px) rotateX(${rotX.toFixed(1)}deg) translateY(${y.toFixed(1)}px)`;
            item.el.style.filter = 'none';
            break;
          }

          case 'glitch': {
            const t = normTime;
            const jitterX = (Math.random() - 0.5) * 8 * (1 - t);
            const jitterY = (Math.random() - 0.5) * 4 * (1 - t);
            item.el.style.opacity = Math.random() > 0.25 ? '1' : '0.3';
            item.el.style.transform = `translate(${jitterX.toFixed(1)}px, ${jitterY.toFixed(1)}px)`;
            item.el.style.filter = 'none';
            item.el.style.textShadow = (1 - t) > 0.2 ? '2px 0 #00e5ff, -2px 0 #ffe600' : '';
            break;
          }

          case 'slide-up':
          default: {
            const t = this.easeOutCubic(normTime);
            item.el.style.opacity = t.toFixed(3);
            item.el.style.transform = `translateY(${(this.LETTER_SLIDE_PX * (1 - t)).toFixed(1)}px)`;
            item.el.style.filter = 'none';
            break;
          }
        }
      } else {
        item.el.style.opacity = '1';
        item.el.style.transform = 'none';
        item.el.style.filter = 'none';
        item.el.style.textShadow = '';
      }
    }
  }

  private updateCounters(elapsed: number): void {
    for (const item of this.countTimeline) {
      const duration = Math.max(0.1, item.end - item.start);

      if (elapsed < item.start) {
        item.el.textContent = '0';
        item.el.style.opacity = '0';
        item.el.style.transform = 'scale(0.85) translateY(20px)';
        item.el.style.textShadow = 'none';
      } else {
        const progress = Math.min(1, Math.max(0, (elapsed - item.start) / duration));
        const val = Math.round(item.to * this.easeOutCubic(progress));
        item.el.textContent = val.toString();

        const fadeInProgress = Math.min(1, (elapsed - item.start) / 0.25);
        item.el.style.opacity = fadeInProgress.toFixed(3);

        if (progress < 1) {
          const pop = 1 + 0.08 * (1 - progress) + Math.sin(progress * Math.PI * 4) * 0.03;
          item.el.style.transform = `scale(${pop.toFixed(3)})`;
          const glow = Math.round(18 + 30 * progress);
          item.el.style.textShadow = `0 0 ${glow}px var(--purple), 0 0 ${glow * 2}px rgba(177, 75, 255, 0.45)`;
        } else {
          item.el.style.transform = 'scale(1)';
          item.el.style.textShadow = '0 0 25px var(--purple), 0 0 50px rgba(177, 75, 255, 0.4)';
        }
      }
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  private updatePlayerControls(): void {
    const pct = Math.min(100, Math.max(0, (this.currentPlaybackTime / this.totalDuration) * 100));
    if (this.timelineBar) {
      this.timelineBar.style.width = `${pct.toFixed(2)}%`;
    }
    if (this.timelineThumb) {
      this.timelineThumb.style.left = `${pct.toFixed(2)}%`;
    }
    if (this.timeDisplay) {
      this.timeDisplay.textContent = `${this.formatTime(this.currentPlaybackTime)} / ${this.formatTime(this.totalDuration)}`;
    }
  }

  public togglePlayPause(): void {
    this.isPaused = !this.isPaused;
    if (this.playPauseIcon && this.playPauseText) {
      if (this.isPaused) {
        this.playPauseIcon.textContent = '▶';
        this.playPauseText.textContent = 'Play';
      } else {
        this.playPauseIcon.textContent = '⏸';
        this.playPauseText.textContent = 'Pause';
      }
    }
  }

  public setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.round(speed * 100) / 100;

    let matchedPreset = false;
    document.querySelectorAll('.speed-btn:not(.custom-pill)').forEach((btn) => {
      const s = parseFloat((btn as HTMLElement).dataset.speed || '1.0');
      const isMatch = Math.abs(s - this.playbackSpeed) < 0.04;
      btn.classList.toggle('active', isMatch);
      if (isMatch) matchedPreset = true;
    });

    document.querySelectorAll('.speed-pill-btn').forEach((btn) => {
      const s = parseFloat((btn as HTMLElement).dataset.speed || '1.0');
      btn.classList.toggle('active', Math.abs(s - this.playbackSpeed) < 0.04);
    });

    // Custom button & label in player bar
    if (this.playerCustomSpeedBtn) {
      this.playerCustomSpeedBtn.classList.toggle('active', !matchedPreset);
    }
    if (this.playerCustomSpeedLabel) {
      this.playerCustomSpeedLabel.textContent = !matchedPreset ? `${this.playbackSpeed.toFixed(2)}x` : 'Custom';
    }

    // Sliders & Badges synchronization
    if (this.customSpeedSlider) {
      this.customSpeedSlider.value = this.playbackSpeed.toString();
    }
    if (this.playerSpeedRange) {
      this.playerSpeedRange.value = this.playbackSpeed.toString();
    }
    if (this.playerSpeedVal) {
      this.playerSpeedVal.textContent = `${this.playbackSpeed.toFixed(2)}x`;
    }

    const studioBadge = document.getElementById('studio-speed-badge');
    if (studioBadge) {
      studioBadge.textContent = `${this.playbackSpeed.toFixed(2)}x`;
    }
  }

  public setAnimationStyle(style: AnimationStyle): void {
    this.currentAnimationStyle = style;
    localStorage.setItem('kinetic_anim_style', style);

    document.querySelectorAll('.style-btn').forEach((btn) => {
      const a = (btn as HTMLElement).dataset.anim;
      btn.classList.toggle('active', a === style);
    });

    const badge = document.getElementById('anim-style-badge');
    if (badge) {
      const names: Record<string, string> = {
        'slide-up': 'Slide Up',
        'typewriter': 'Typewriter',
        'pop-zoom': 'Pop Zoom',
        'blur-focus': 'Blur Focus',
        'flip-3d': '3D Flip',
        'glitch': 'Glitch',
      };
      badge.textContent = names[style] || style;
    }
  }

  public setFont(fontName: string): void {
    this.currentFont = fontName;
    localStorage.setItem('kinetic_font', fontName);

    const fontMap: Record<string, string> = {
      'Inter': "'Inter', system-ui, sans-serif",
      'Outfit': "'Outfit', sans-serif",
      'JetBrains Mono': "'JetBrains Mono', monospace",
      'Montserrat': "'Montserrat', sans-serif",
    };

    const family = fontMap[fontName] || fontName;
    this.stage.style.fontFamily = family;

    document.querySelectorAll('.font-btn').forEach((btn) => {
      const f = (btn as HTMLElement).dataset.font;
      btn.classList.toggle('active', f === fontName);
    });

    const badge = document.getElementById('font-style-badge');
    if (badge) {
      badge.textContent = fontName;
    }
  }

  public seekTo(timeSeconds: number): void {
    this.currentPlaybackTime = Math.max(0, Math.min(this.totalDuration, timeSeconds));
    this.renderFrame(this.currentPlaybackTime);
    this.updatePlayerControls();
  }

  public resetAll(): void {
    for (const item of this.letterTimeline) {
      item.el.style.opacity = '0';
      item.el.style.transform = `translateY(${this.LETTER_SLIDE_PX}px)`;
      item.el.style.filter = 'none';
      item.el.style.textShadow = '';
    }
    for (const item of this.countTimeline) {
      item.el.textContent = '0';
      item.el.style.opacity = '0';
      item.el.style.transform = 'scale(1)';
      item.el.style.textShadow = 'none';
    }
    for (const sc of this.sceneConfigs) {
      sc.el.style.opacity = '0';
      sc.el.style.pointerEvents = 'none';
      sc.el.querySelectorAll('.initial').forEach((init) => {
        init.classList.remove('glow', 'pulse');
      });
    }
    this.stage.style.opacity = '1';
  }

  public startAnimation(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.resetAll();
    this.currentPlaybackTime = 0;
    this.lastTimestamp = null;
    this.isPaused = false;
    if (this.playPauseIcon && this.playPauseText) {
      this.playPauseIcon.textContent = '⏸';
      this.playPauseText.textContent = 'Pause';
    }
    this.stage.style.opacity = '1';
    this.animationId = requestAnimationFrame(this.tick);
  }

  public setAspectRatio(ratio: string): void {
    this.currentAspectRatio = ratio;
    localStorage.setItem('kinetic_aspect_ratio', ratio);

    this.stage.classList.remove('ratio-9-16', 'ratio-4-5', 'ratio-1-1', 'ratio-16-9', 'ratio-191-1');
    const ratioClass = 'ratio-' + ratio.replace(':', '-').replace('.', '');
    this.stage.classList.add(ratioClass);

    document.querySelectorAll('.ratio-btn').forEach((btn) => {
      const r = (btn as HTMLElement).dataset.ratio;
      btn.classList.toggle('active', r === ratio);
    });

    const names: Record<string, string> = {
      '9:16': '9:16 Vertical',
      '4:5': '4:5 Portrait',
      '1:1': '1:1 Square',
      '16:9': '16:9 Landscape',
      '1.91:1': '1.91:1 Widescreen',
    };

    if (this.aspectRatioBadge) {
      this.aspectRatioBadge.textContent = names[ratio] || ratio;
    }

    this.autoShrinkLines();
  }

  private loadSavedSettings(): void {
    const savedScript = localStorage.getItem('kinetic_script');
    const savedDuration = localStorage.getItem('kinetic_duration');
    const savedAnim = localStorage.getItem('kinetic_anim_style') as AnimationStyle | null;
    const savedFont = localStorage.getItem('kinetic_font');

    if (this.scriptInput) {
      this.scriptInput.value = savedScript || this.DEFAULT_MCP_SCRIPT;
    }

    if (savedDuration && this.durationSlider) {
      this.durationSlider.value = savedDuration;
      this.isAutoDuration = false;
      this.autoDurationBtn?.classList.remove('active');
      this.autoPillBtn?.classList.remove('active');
      if (this.durationBadge) {
        this.durationBadge.textContent = `${savedDuration}s`;
      }
    } else {
      this.isAutoDuration = true;
    }

    if (savedAnim) {
      this.setAnimationStyle(savedAnim);
    }

    if (savedFont) {
      this.setFont(savedFont);
    }

    const savedRatio = localStorage.getItem('kinetic_aspect_ratio') || '9:16';
    this.setAspectRatio(savedRatio);
  }

  private bindEvents(): void {
    this.playPauseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlayPause();
    });

    this.replayBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startAnimation();
    });

    this.stage.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.player-controls')) return;
      this.togglePlayPause();
    });

    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.seekTo(this.currentPlaybackTime - 5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.seekTo(this.currentPlaybackTime + 5);
      }
    });

    // Step backward & forward 5s buttons
    this.stepBackBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.seekTo(this.currentPlaybackTime - 5);
    });

    this.stepFwdBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.seekTo(this.currentPlaybackTime + 5);
    });

    // Speed selector presets in player
    document.querySelectorAll('.speed-btn:not(.custom-pill)').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const speed = parseFloat((btn as HTMLElement).dataset.speed || '1.0');
        this.setPlaybackSpeed(speed);
        this.playerCustomSpeedPopover?.classList.remove('visible');
      });
    });

    // Speed selector in Studio panel
    document.querySelectorAll('.speed-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = parseFloat((btn as HTMLElement).dataset.speed || '1.0');
        this.setPlaybackSpeed(speed);
      });
    });

    // Custom speed slider in Studio panel
    this.customSpeedSlider?.addEventListener('input', () => {
      const speed = parseFloat(this.customSpeedSlider!.value);
      this.setPlaybackSpeed(speed);
    });

    // Player Custom Speed Button & Popover
    this.playerCustomSpeedBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.playerCustomSpeedPopover?.classList.toggle('visible');
    });

    this.playerSpeedRange?.addEventListener('input', () => {
      const speed = parseFloat(this.playerSpeedRange!.value);
      this.setPlaybackSpeed(speed);
    });

    // Close popover when clicking anywhere else
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.player-custom-speed-wrapper')) {
        this.playerCustomSpeedPopover?.classList.remove('visible');
      }
    });

    // 6 Animation Styles Buttons
    document.querySelectorAll('.style-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const style = (btn as HTMLElement).dataset.anim as AnimationStyle;
        if (style) {
          this.setAnimationStyle(style);
        }
      });
    });

    // Custom Font Buttons
    document.querySelectorAll('.font-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const font = (btn as HTMLElement).dataset.font;
        if (font) {
          this.setFont(font);
        }
      });
    });

    // Live Script input stats & auto duration recalculation
    this.scriptInput?.addEventListener('input', () => {
      this.updateScriptStats();
    });

    // Auto Duration Toggle Button
    this.autoDurationBtn?.addEventListener('click', () => {
      this.isAutoDuration = !this.isAutoDuration;
      this.autoDurationBtn?.classList.toggle('active', this.isAutoDuration);
      this.autoPillBtn?.classList.toggle('active', this.isAutoDuration);
      if (this.isAutoDuration) {
        localStorage.removeItem('kinetic_duration');
        this.updateScriptStats();
      }
    });

    // Auto Pace Pill
    this.autoPillBtn?.addEventListener('click', () => {
      this.isAutoDuration = true;
      this.autoDurationBtn?.classList.add('active');
      document.querySelectorAll('.preset-pills .pill-btn').forEach((p) => p.classList.remove('active'));
      this.autoPillBtn?.classList.add('active');
      localStorage.removeItem('kinetic_duration');
      this.updateScriptStats();
    });

    // Yellow Glow Tool Button
    this.highlightYellowBtn?.addEventListener('click', () => {
      if (!this.scriptInput) return;
      const start = this.scriptInput.selectionStart;
      const end = this.scriptInput.selectionEnd;
      const val = this.scriptInput.value;

      if (start !== end) {
        const selected = val.substring(start, end);
        const replacement = `*${selected}*`;
        this.scriptInput.value = val.substring(0, start) + replacement + val.substring(end);
        this.scriptInput.focus();
        this.scriptInput.setSelectionRange(start, start + replacement.length);
      } else {
        const insert = '*glowing text*';
        this.scriptInput.value = val.substring(0, start) + insert + val.substring(end);
        this.scriptInput.focus();
        this.scriptInput.setSelectionRange(start + 1, start + insert.length - 1);
      }
      this.updateScriptStats();
    });

    // Timeline scrubber: Interactive forward & backward dragging
    const getScrubTime = (clientX: number): number => {
      if (!this.timelineWrap) return 0;
      const rect = this.timelineWrap.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * this.totalDuration;
    };

    const updateTooltip = (clientX: number) => {
      if (!this.timelineWrap || !this.timelineTooltip) return;
      const rect = this.timelineWrap.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetSec = ratio * this.totalDuration;
      this.timelineTooltip.textContent = this.formatTime(targetSec);
      this.timelineTooltip.style.left = `${(ratio * 100).toFixed(1)}%`;
      this.timelineTooltip.classList.add('visible');
    };

    this.timelineWrap?.addEventListener('pointerdown', (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      this.isScrubbing = true;
      this.timelineWrap?.classList.add('dragging');
      try {
        this.timelineWrap?.setPointerCapture(e.pointerId);
      } catch (_) {}

      const targetSec = getScrubTime(e.clientX);
      this.seekTo(targetSec);
      updateTooltip(e.clientX);
    });

    this.timelineWrap?.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.isScrubbing) {
        e.stopPropagation();
        const targetSec = getScrubTime(e.clientX);
        this.seekTo(targetSec);
        updateTooltip(e.clientX);
      } else {
        updateTooltip(e.clientX);
      }
    });

    this.timelineWrap?.addEventListener('pointerup', (e: PointerEvent) => {
      if (this.isScrubbing) {
        e.stopPropagation();
        this.isScrubbing = false;
        this.timelineWrap?.classList.remove('dragging');
        this.timelineTooltip?.classList.remove('visible');
        try {
          this.timelineWrap?.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    });

    this.timelineWrap?.addEventListener('pointercancel', () => {
      this.isScrubbing = false;
      this.timelineWrap?.classList.remove('dragging');
      this.timelineTooltip?.classList.remove('visible');
    });

    this.timelineWrap?.addEventListener('mouseleave', () => {
      if (!this.isScrubbing) {
        this.timelineTooltip?.classList.remove('visible');
      }
    });

    // Manual slider override
    this.durationSlider?.addEventListener('input', () => {
      this.isAutoDuration = false;
      this.autoDurationBtn?.classList.remove('active');
      this.autoPillBtn?.classList.remove('active');
      const sec = parseInt(this.durationSlider!.value, 10);
      if (this.durationBadge) {
        const mins = (sec / 60).toFixed(1).replace('.0', '');
        this.durationBadge.textContent = `${sec}s (${mins}m Manual)`;
      }
      document.querySelectorAll('.preset-pills .pill-btn').forEach((p) => {
        const btnSec = parseInt((p as HTMLElement).dataset.sec || '0', 10);
        p.classList.toggle('active', btnSec === sec);
      });
    });

    // Manual preset pills (60s, 120s, 180s)
    document.querySelectorAll('.preset-pills .pill-btn').forEach((pill) => {
      pill.addEventListener('click', () => {
        const secAttr = (pill as HTMLElement).dataset.sec;
        if (secAttr === 'auto') return;

        const sec = parseInt(secAttr || '60', 10);
        this.isAutoDuration = false;
        this.autoDurationBtn?.classList.remove('active');
        if (this.durationSlider) {
          this.durationSlider.value = sec.toString();
        }
        if (this.durationBadge) {
          const mins = (sec / 60).toFixed(1).replace('.0', '');
          this.durationBadge.textContent = `${sec}s (${mins}m Manual)`;
        }
        document.querySelectorAll('.preset-pills .pill-btn').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    this.toggleBtn?.addEventListener('click', () => {
      this.appContainer?.classList.toggle('panel-collapsed');
      this.studioPanel?.classList.toggle('collapsed');
      this.autoShrinkLines();
    });

    this.closeBtn?.addEventListener('click', () => {
      this.appContainer?.classList.add('panel-collapsed');
      this.studioPanel?.classList.add('collapsed');
      this.autoShrinkLines();
    });

    this.animateBtn?.addEventListener('click', () => {
      const scriptText = this.scriptInput?.value.trim() || '';
      const durationSec = parseInt(this.durationSlider?.value || '60', 10);

      if (!scriptText) return;

      localStorage.setItem('kinetic_script', scriptText);
      if (!this.isAutoDuration) {
        localStorage.setItem('kinetic_duration', durationSec.toString());
      } else {
        localStorage.removeItem('kinetic_duration');
      }

      const generatedScenesHtml = this.parseScript(scriptText, durationSec);
      if (generatedScenesHtml) {
        this.scenesContainer.innerHTML = generatedScenesHtml;
        this.stage.setAttribute('aria-label', scriptText.replace(/\n+/g, ' '));
        this.buildTimeline();
        this.autoShrinkLines();
        this.startAnimation();
      }

      if (window.innerWidth < 960) {
        this.studioPanel?.classList.add('collapsed');
      }
    });

    this.resetBtn?.addEventListener('click', () => {
      if (this.scriptInput) {
        this.scriptInput.value = this.DEFAULT_MCP_SCRIPT;
      }
      this.isAutoDuration = true;
      this.autoDurationBtn?.classList.add('active');
      this.autoPillBtn?.classList.add('active');
      this.setAnimationStyle('slide-up');
      this.setFont('Inter');
      localStorage.removeItem('kinetic_script');
      localStorage.removeItem('kinetic_duration');
      this.updateScriptStats();
      this.animateBtn?.click();
    });

    window.addEventListener('resize', () => this.autoShrinkLines());

    // Aspect Ratio Buttons in Studio Panel (range from 1.91:1 to 9:16)
    document.querySelectorAll('.ratio-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ratio = (btn as HTMLElement).dataset.ratio;
        if (ratio) {
          this.setAspectRatio(ratio);
        }
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new KineticStudio();
});
