import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDownIcon,
  HeartFilledIcon,
  PauseIcon,
  ReloadIcon,
  SpeakerLoudIcon,
} from "@radix-ui/react-icons";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
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
  },
  {
    number: "02",
    title: "深夜长谈",
    copy: "从一句话聊到很多句话，把很长的夜晚聊得很短。",
  },
  {
    number: "03",
    title: "分享视频",
    copy: "分享的不只是视频，也是“这一刻，我想到了你”。",
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

const sceneIds = Object.keys(sceneTones) as SceneId[];

export default function Prototype() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [foundLights, setFoundLights] = useState<number[]>([]);
  const [activeScene, setActiveScene] = useState<SceneId>("prologue");
  const elapsedDays = useMemo(daysSinceMeeting, []);

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
    document.querySelector("#prologue")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="story-app" onPointerDownCapture={handleFirstInteraction}>
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
            </motion.header>
            <div className="memory-list">
              {memories.map((memory, index) => (
                <motion.article
                  key={memory.number}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: 0.1 + index * 0.09 }}
                >
                  <span className="memory-number">{memory.number}</span>
                  <div>
                    <h3>{memory.title}</h3>
                    <p>{memory.copy}</p>
                  </div>
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
              <button className="replay-button" type="button" onClick={replay}>
                <ReloadIcon />
                <span>再看一遍</span>
              </button>
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
      </div>
    </MotionConfig>
  );
}
