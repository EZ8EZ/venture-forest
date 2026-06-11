// Bridge between the render loop and DOM overlays. ForestCamera writes the
// camera's ground position and heading here every frame; the minimap reads
// it on its own requestAnimationFrame and mutates the DOM directly. No
// React state is involved, so the per-frame cost is two style writes
// (performance rule: never trigger React re-renders from the render loop).
export const cameraTracker = {
  x: 0,
  z: 0,
  // Radians, world space: the direction the camera looks, projected to XZ
  heading: 0,
};
