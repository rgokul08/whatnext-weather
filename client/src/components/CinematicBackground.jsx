import React, { useEffect, useRef } from "react";

const VIDEO_SRC = "/background/mountain-time-lapse-hq.mp4";
const POSTER_SRC = "/background/mountain-time-lapse-poster.jpg";

export default function CinematicBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    video.muted = true;
    video.defaultMuted = true;

    const startPlayback = () => {
      if (reducedMotion) {
        video.pause();
        return;
      }
      const promise = video.play();
      if (promise && typeof promise.then === "function") {
        promise.catch(() => undefined);
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
    </>
  );
}
