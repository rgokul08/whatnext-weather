import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const VIDEO_SRC = "/background/mountain-time-lapse-hq.mp4";
const POSTER_SRC = "/background/mountain-time-lapse-poster.jpg";

export default function CinematicBackground() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    video.muted = true;
    video.defaultMuted = true;

    const startPlayback = () => {
      if (reducedMotion) {
        video.pause();
        setIsPlaying(false);
        return;
      }
      const promise = video.play();
      if (promise && typeof promise.then === "function") {
        promise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };

    video.addEventListener("canplay", startPlayback, { once: true });
    video.addEventListener("loadeddata", startPlayback, { once: true });
    startPlayback();

    return () => {
      video.removeEventListener("canplay", startPlayback);
      video.removeEventListener("loadeddata", startPlayback);
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        className="cinematic-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={POSTER_SRC}
        disablePictureInPicture
        aria-hidden="true"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
      <div className="cinematic-overlay" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <button
        type="button"
        className="video-playback-control"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause background video" : "Play background video"}
        title={isPlaying ? "Pause background video" : "Play background video"}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        <span>{isPlaying ? "Pause motion" : "Play motion"}</span>
      </button>
    </>
  );
}
