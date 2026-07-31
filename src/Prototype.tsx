import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cross2Icon,
  EnterFullScreenIcon,
  HeartFilledIcon,
  PauseIcon,
  ReloadIcon,
  Share2Icon,
  SpeakerLoudIcon,
} from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { MobileScroll } from "./mobile";

const storyImages = {
  moon: "/assets/story/scene-moon.webp",
  harbor: "/assets/story/scene-harbor.webp",
  forest: "/assets/story/scene-forest.webp",
};

const memories = [
  {
    number: "01",
    title: "一起打王者",
    copy: "输赢会被忘记，但耳机那边是你的晚上，我会记得。",
    detail: "后来才发现，我记住的不是战绩，是每一局结束后还不想下线。",
  },
  {
    number: "02",
    title: "深夜长谈",
    copy: "从一句话聊到很多句话，把很长的夜晚聊得很短。",
    detail: "有些话只有深夜才说得出口，而你愿意认真听。",
  },
  {
    number: "03",
    title: "分享视频",
    copy: "分享的不只是视频，也是“这一刻，我想到了你”。",
    detail: "那个“转发”按钮，慢慢变成了想起彼此的暗号。",
  },
];

const lightMessages = [
  "第一束光：谢谢你愿意出现。",
  "第二束光：谢谢你愿意认真听我说话。",
  "第三束光：想和你继续分享以后的日常。",
];

function daysSinceMeeting() {
  const start = new Date(2026, 4, 1);
  const anniversary = new Date(2026, 6, 31);
  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.min(91, Math.floor((current.getTime() - start.getTime()) / 86400000)));
}

const revealProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.16 },
  transition: { duration: 0.86, delay: 0.08, ease: [0.22, 1, 0.36, 1] },
} as const;

const panelProps = {
  initial: { opacity: 0.46, y: 30, scale: 0.988 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.08 },
  transition: { duration: 0.92, ease: [0.22, 1, 0.36, 1] },
} as const;

const sceneImageProps = {
  initial: { opacity: 0.7, scale: 1.055 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 1.45, ease: [0.22, 1, 0.36, 1] },
} as const;

const sceneTones = {
  prologue: "moon",
  "chapter-one": "deep-sea",
  forest: "forest",
  memories: "deep-sea",
  harbor: "harbor",
  letter: "paper",
  lights: "harbor",
  finale: "moon",
} as const;

type SceneId = keyof typeof sceneTones;
type ShareState = "idle" | "shared" | "copied" | "error";

const sceneIds = Object.keys(sceneTones) as SceneId[];

const chapters: Array<{ id: SceneId; number: string; label: string }> = [
  { id: "prologue", number: "01", label: "月光" },
  { id: "chapter-one", number: "02", label: "九十天" },
  { id: "forest", number: "03", label: "去海边的路" },
  { id: "memories", number: "04", label: "三件小事" },
  { id: "harbor", number: "05", label: "想到你" },
  { id: "letter", number: "06", label: "见字如面" },
  { id: "lights", number: "07", label: "三束光" },
  { id: "finale", number: "08", label: "给三三" },
];

function KeepsakeArtwork() {
  return (
    <>
      <img
        src={storyImages.moon}
        alt="月光海面上的三个月纪念卡"
        decoding="async"
        loading="lazy"
      />
      <div className="keepsake-wash" aria-hidden="true" />
      <div className="keepsake-copy">
        <p>THREE MONTHS · FOR SANSAN</p>
        <h3>三三，<br />三个月快乐。</h3>
        <blockquote>
          有些平常的瞬间，
          <br />
          因为是和你一起，就有了光。
        </blockquote>
        <div className="keepsake-meta">
          <span>2026.05.01</span>
          <i aria-hidden="true" />
          <span>2026.07.31</span>
        </div>
      </div>
    </>
  );
}

export default function Prototype() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [foundLights, setFoundLights] = useState<number[]>([]);
  const [activeScene, setActiveScene] = useState<SceneId>("prologue");
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [openMemory, setOpenMemory] = useState<number | null>(null);
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false);
  const [keepsakeOpen, setKeepsakeOpen] = useState(false);
  const elapsedDays = useMemo(daysSinceMeeting, []);
  const activeChapter = chapters.find((chapter) => chapter.id === activeScene) ?? chapters[0];

  const playMusic = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.46;
    await audio.play();
  }, []);

  useEffect(() => {
    const target = window.location.hash;
    if (!target) return;

    const timer = window.setTimeout(() => {
      document.querySelector(target)?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 240);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void playMusic().catch(() => {
      setPlaying(false);
    });
  }, [playMusic]);

  useEffect(() => {
    const scrollRoot = document.querySelector<HTMLElement>(".story-app .mobile-scroll");
    if (!scrollRoot) return;

    const visibility = new Map<SceneId, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id as SceneId;
          visibility.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        const nextScene = sceneIds.reduce((current, candidate) =>
          (visibility.get(candidate) ?? 0) > (visibility.get(current) ?? 0) ? candidate : current,
        );

        if ((visibility.get(nextScene) ?? 0) > 0.06) {
          setActiveScene(nextScene);
        }
      },
      {
        root: scrollRoot,
        threshold: [0.06, 0.16, 0.3, 0.48, 0.66],
      },
    );

    sceneIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chapterMenuOpen) return;

    const closeMenu = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest(".chapter-nav")) {
        setChapterMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", closeMenu);
    return () => window.removeEventListener("pointerdown", closeMenu);
  }, [chapterMenuOpen]);

  useEffect(() => {
    if (!chapterMenuOpen && !keepsakeOpen) return;

    const closeOverlay = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setChapterMenuOpen(false);
      setKeepsakeOpen(false);
    };

    window.addEventListener("keydown", closeOverlay);
    return () => window.removeEventListener("keydown", closeOverlay);
  }, [chapterMenuOpen, keepsakeOpen]);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await playMusic();
    } else {
      audio.pause();
    }
  };

  const beginStory = async () => {
    setStarted(true);
    const fullscreenRequest =
      !document.fullscreenElement && document.documentElement.requestFullscreen
        ? document.documentElement.requestFullscreen()
        : undefined;

    try {
      await playMusic();
    } catch {
      setPlaying(false);
    }

    try {
      await fullscreenRequest;
    } catch {
      // Fullscreen support varies across mobile browsers.
    }
    window.setTimeout(() => {
      document.querySelector("#chapter-one")?.scrollIntoView({ behavior: "smooth" });
    }, 720);
  };

  const handleFirstInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest(".music-control")) return;
    if (!audioRef.current?.paused) return;

    void playMusic().catch(() => {
      setPlaying(false);
    });
  };

  const collectLight = (index: number) => {
    setFoundLights((current) => {
      if (current.includes(index)) return current;
      return [...current, index];
    });
  };

  const replay = () => {
    setFoundLights([]);
    setKeepsakeOpen(false);
    document.querySelector("#prologue")?.scrollIntoView({ behavior: "smooth" });
  };

  const jumpToScene = (id: SceneId) => {
    setChapterMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const shareStory = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    const shareData = {
      title: "写给三三的三个月",
      text: "从五月的第一天，到七月的最后一天。有些平常的瞬间，因为是和你一起，就有了光。",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareState("shared");
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
      } catch {
        setShareState("error");
      }
    }
  };

  return (
    <div
      className="story-app"
      data-keepsake-open={keepsakeOpen ? "true" : "false"}
      onPointerDownCapture={handleFirstInteraction}
    >
        <audio
          ref={audioRef}
          autoPlay
          loop
          preload="auto"
          src="/assets/story/ballade-pour-adeline-web.mp3"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        <AnimatePresence initial={false}>
          <motion.div
            key={activeScene}
            className={`ambient-layer ambient-${sceneTones[activeScene]}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />
        </AnimatePresence>
        <div className="cinematic-vignette" aria-hidden="true" />

        <nav className="chapter-nav" aria-label="故事章节" data-open={chapterMenuOpen ? "true" : "false"}>
          <button
            className="chapter-nav-trigger"
            type="button"
            onClick={() => setChapterMenuOpen((open) => !open)}
            aria-expanded={chapterMenuOpen}
          >
            <span className="chapter-nav-number">{activeChapter.number}</span>
            <span className="chapter-nav-label">{activeChapter.label}</span>
            <ChevronDownIcon />
          </button>
          <AnimatePresence initial={false}>
            {chapterMenuOpen ? (
              <motion.div
                className="chapter-nav-menu"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => jumpToScene(chapter.id)}
                    data-active={chapter.id === activeScene ? "true" : "false"}
                  >
                    <span>{chapter.number}</span>
                    <strong>{chapter.label}</strong>
                    <ChevronRightIcon />
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </nav>

      <button
        className="music-control"
        type="button"
        onClick={toggleMusic}
        aria-label={playing ? "暂停音乐" : "播放音乐"}
        data-playing={playing ? "true" : "false"}
      >
        {playing ? <PauseIcon /> : <SpeakerLoudIcon />}
      </button>

        <MobileScroll className="app-screen">
          <main className="story-content" aria-label="写给三三的三个月纪念">
          <section className="prologue full-scene story-panel" id="prologue">
            <motion.img
              className="scene-image"
              src={storyImages.moon}
              alt="月光洒在安静的海面上"
              decoding="async"
              fetchPriority="high"
              loading="eager"
              initial={{ opacity: 0.7, scale: 1.045 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="scene-wash" aria-hidden="true" />
            <motion.div
              className="prologue-copy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2 }}
            >
              <p className="kicker">写给宋智慧，也写给三三</p>
              <p className="date-line">2026.05.01 — 2026.07.31</p>
              <h1>
                三个月，
                <span>刚刚好。</span>
              </h1>
              <p className="lead">
                从五月的第一天，到七月的最后一天。
                <br />
                有些平常的瞬间，因为是和你一起，就有了光。
              </p>
              <button
                className="story-button"
                type="button"
                onClick={beginStory}
                data-started={started ? "true" : "false"}
              >
                <span>{started ? "继续往下看" : "三三，开始看吧"}</span>
                <ChevronDownIcon />
              </button>
            </motion.div>
            <p className="scene-index">NO. 01 / MOONLIGHT</p>
          </section>

          <motion.section
            className="chapter chapter-intro story-panel"
            id="chapter-one"
            {...panelProps}
          >
            <motion.div className="chapter-heading" {...revealProps}>
              <p className="kicker">OUR FIRST 90 DAYS</p>
              <span className="chapter-number">{String(elapsedDays).padStart(2, "0")}</span>
              <h2>我们把夜晚<br />聊得很短</h2>
              <p>
                从陌生到熟悉，大概就是很多个
                <br />
                舍不得说晚安的夜晚。
              </p>
            </motion.div>
            <div className="fine-rule" aria-hidden="true" />
          </motion.section>

          <motion.section
            className="forest-scene full-scene story-panel"
            id="forest"
            {...panelProps}
          >
            <motion.img
              className="scene-image"
              src={storyImages.forest}
              alt="夜色森林尽头通向海边的小路"
              decoding="async"
              loading="lazy"
              {...sceneImageProps}
            />
            <div className="scene-wash scene-wash-strong" aria-hidden="true" />
            <motion.blockquote {...revealProps}>
              <span>“</span>
              有些路看不见尽头也没关系。
              <br />
              因为有人愿意陪你边走边说。
            </motion.blockquote>
            <p className="scene-index">NO. 02 / THE WAY TO THE SEA</p>
          </motion.section>

          <motion.section
            className="memory-chapter story-panel"
            id="memories"
            {...panelProps}
          >
            <motion.header {...revealProps}>
              <p className="kicker">THREE SMALL THINGS</p>
              <h2>我记得的，<br />三件小事。</h2>
              <p className="memory-hint">轻触每一件小事，看看我还记住了什么。</p>
            </motion.header>
            <div className="memory-list">
              {memories.map((memory, index) => (
                <motion.article
                  key={memory.number}
                  data-open={openMemory === index ? "true" : "false"}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: 0.1 + index * 0.09 }}
                >
                  <button
                    className="memory-trigger"
                    type="button"
                    onClick={() => setOpenMemory((open) => (open === index ? null : index))}
                    aria-expanded={openMemory === index}
                  >
                    <span className="memory-number">{memory.number}</span>
                    <span className="memory-summary">
                      <strong>{memory.title}</strong>
                      <small>{memory.copy}</small>
                    </span>
                    <ChevronDownIcon className="memory-chevron" />
                  </button>
                  <AnimatePresence initial={false}>
                    {openMemory === index ? (
                      <motion.div
                        className="memory-detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p>{memory.detail}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.article>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="harbor-scene full-scene story-panel"
            id="harbor"
            {...panelProps}
          >
            <motion.img
              className="scene-image"
              src={storyImages.harbor}
              alt="海边公路与亮起的路灯"
              decoding="async"
              loading="lazy"
              {...sceneImageProps}
            />
            <div className="scene-wash" aria-hidden="true" />
            <motion.div className="harbor-copy" {...revealProps}>
              <p className="kicker">SOMETHING WARM</p>
              <h2>看见有趣，<br />就会想到你。</h2>
              <p>
                也许惦记一个人，本来就会藏在
                <br />
                这么多不起眼的小瞬间里。
              </p>
            </motion.div>
            <p className="scene-index">NO. 03 / STREETLIGHT</p>
          </motion.section>

          <motion.section
            className="letter-chapter story-panel"
            id="letter"
            {...panelProps}
          >
            <motion.div className="letter-heading" {...revealProps}>
              <p className="kicker">A LETTER FOR SANSAN</p>
              <p className="letter-date">二〇二六年七月三十一日</p>
              <h2>三三，见字如面。</h2>
            </motion.div>
            <motion.div className="letter-copy" {...revealProps}>
              <p>
                认识你的这三个月，我越来越觉得，
                <strong>你是一个很纯粹的人。</strong>
              </p>
              <p>
                我知道我并不完美，也不总能把心里的话表达得很好。
                但与你相处时的开心是真的，想认真珍惜这段相遇也是真的。
              </p>
              <p>
                谢谢你陪我打过的每一局游戏，陪我聊过的每一个深夜，
                也谢谢你愿意把有趣的、琐碎的日常分享给我。
              </p>
              <p>
                我不急着说多么遥远的话。只希望以后的日子里，
                我们还可以认真倾听彼此，也给彼此足够的理解和空间。
              </p>
              <p>三三，三个月快乐。很庆幸，五月的第一天认识了你。</p>
            </motion.div>
            <motion.div className="signature" {...revealProps}>
              <span>很庆幸认识你的我</span>
              <span className="signature-mark">05 / 01</span>
            </motion.div>
          </motion.section>

          <motion.section
            className="light-chapter story-panel"
            id="lights"
            {...panelProps}
          >
            <motion.img
              className="light-background"
              src={storyImages.harbor}
              alt=""
              aria-hidden="true"
              decoding="async"
              loading="lazy"
              {...sceneImageProps}
            />
            <div className="scene-wash scene-wash-strong" aria-hidden="true" />
            <motion.div className="light-copy" {...revealProps}>
              <p className="kicker">A LITTLE SECRET</p>
              <h2>把三束光，<br />送给三三。</h2>
              <p>轻轻点亮海边的三盏灯。</p>
            </motion.div>
            <div className="light-field" aria-label="寻找三束光">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  className={`light-point light-point-${index + 1}`}
                  type="button"
                  onClick={() => collectLight(index)}
                  data-found={foundLights.includes(index) ? "true" : "false"}
                  aria-label={`点亮第 ${index + 1} 束光`}
                >
                  <HeartFilledIcon />
                </button>
              ))}
            </div>
            <div className="light-status" aria-live="polite">
              <div className="light-counter">
                <span>{foundLights.length}</span>
                <small>/ 03</small>
              </div>
              <p>
                {foundLights.length === 0
                  ? "三束光还在等你"
                  : lightMessages[foundLights.length - 1]}
              </p>
            </div>
          </motion.section>

          <motion.section
            className="finale-chapter full-scene story-panel"
            id="finale"
            data-unlocked={foundLights.length === 3 ? "true" : "false"}
            {...panelProps}
          >
            <motion.img
              className="scene-image"
              src={storyImages.moon}
              alt="月光照亮海面"
              decoding="async"
              loading="lazy"
              {...sceneImageProps}
            />
            <div className="scene-wash scene-wash-strong" aria-hidden="true" />
            <motion.div className="finale-copy" {...revealProps}>
              <p className="kicker">FOR SANSAN</p>
              <HeartFilledIcon className="finale-heart" />
              <h2>三三，<br />三个月快乐。</h2>
              <p>
                愿你一直保留那份纯粹。
                <br />
                也愿我们把平凡的日子，继续过成值得记住的故事。
              </p>
              <p className="finale-date">05.01 <span>—</span> 07.31</p>

              <motion.article className="keepsake-card" {...revealProps}>
                <KeepsakeArtwork />
                <button
                  className="keepsake-expand"
                  type="button"
                  onClick={() => setKeepsakeOpen(true)}
                  aria-label="放大查看纪念卡"
                >
                  <EnterFullScreenIcon />
                </button>
              </motion.article>

              <div className="finale-actions">
                <button className="share-button" type="button" onClick={shareStory}>
                  {shareState === "shared" || shareState === "copied" ? (
                    <CheckIcon />
                  ) : (
                    <Share2Icon />
                  )}
                  <span>
                    {shareState === "shared"
                      ? "已经分享"
                      : shareState === "copied"
                        ? "链接已复制"
                        : "分享这片月光"}
                  </span>
                </button>
                <button className="replay-button" type="button" onClick={replay}>
                  <ReloadIcon />
                  <span>再看一遍</span>
                </button>
              </div>
              <p className="share-feedback" aria-live="polite">
                {shareState === "shared"
                  ? "这片月光已经分享出去了。"
                  : shareState === "copied"
                    ? "链接已复制，可以发给想分享的人。"
                    : shareState === "error"
                      ? "可以长按浏览器地址复制链接。"
                      : "可以分享链接，也可以直接截下这张纪念卡。"}
              </p>
            </motion.div>
            <footer>
              <span>Made for 三三 · 2026</span>
              <a
                href="https://pixabay.com/music/modern-classical-ballade-pour-adeline-835/"
                target="_blank"
                rel="noreferrer"
              >
                Music credit
              </a>
            </footer>
          </motion.section>
          </main>
        </MobileScroll>

        <AnimatePresence>
          {keepsakeOpen ? (
            <motion.div
              className="keepsake-modal"
              role="dialog"
              aria-modal="true"
              aria-label="三个月纪念卡"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setKeepsakeOpen(false)}
            >
              <button
                className="keepsake-modal-close"
                type="button"
                onClick={() => setKeepsakeOpen(false)}
                aria-label="关闭纪念卡"
                autoFocus
              >
                <Cross2Icon />
              </button>
              <motion.div
                className="keepsake-modal-content"
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="keepsake-card keepsake-card-modal">
                  <KeepsakeArtwork />
                </div>
                <p>现在这一页只属于三三，可以直接截屏收藏。</p>
                <button className="share-button keepsake-modal-share" type="button" onClick={shareStory}>
                  <Share2Icon />
                  <span>分享这片月光</span>
                </button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
    </div>
  );
}
