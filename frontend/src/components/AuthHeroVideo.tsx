import heroForestImage from "../assets/forrest.jpg";

/** Full-bleed muted loop for login / register (poster + gradient fallback). */
export function AuthHeroVideo() {
  return (
    <div className="auth-hero-video" aria-hidden="true">
      <video
        className="auth-hero-video__media"
        src="/donor_dash_background.mp4"
        poster={heroForestImage}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="auth-hero-video__overlay" />
    </div>
  );
}
