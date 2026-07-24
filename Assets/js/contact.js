// ============================
// reCAPTCHA callbacks (called automatically by Google's script)
// ============================

// Fires when the user successfully passes the checkbox/challenge
function onRecaptchaSuccess(token) {
  document.getElementById('sendBtn').classList.remove('disabled');
}

// Fires if the token expires (~2 minutes) before the form is submitted
function onRecaptchaExpired() {
  document.getElementById('sendBtn').classList.add('disabled');
}

// ============================
// Final guard before the "Send via email" link fires
// ============================
function checkRobot(event) {
  const response = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';

  if (!response || response.length === 0) {
    event.preventDefault();
    alert("Please complete the reCAPTCHA before sending.");
    return false;
  }
  return true;
}

// ============================
// Existing maps link handler
// ============================
function openInMaps(event) {
  event.preventDefault();
  window.open('https://www.google.com/maps/search/?api=1&query=Sagbayan+Bohol+Philippines+6331', '_blank', 'noopener');
}