
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuBtn = document.querySelector(".menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, {passive:true});

  menuBtn?.addEventListener("click", () => {
    mobileMenu?.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", mobileMenu?.classList.contains("open") ? "true" : "false");
  });
  mobileMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mobileMenu.classList.remove("open")));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:.12, rootMargin:"0px 0px -45px"});
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  const form = document.querySelector("#booking-form");

if(form){
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const status = document.querySelector("#form-status");
    const submitButton = form.querySelector('button[type="submit"]');

    const data = new FormData(form);

    // Honeypot spam protection
    if(data.get("website")) return;

    const first = (data.get("first_name") || "").trim();
    const last = (data.get("last_name") || "").trim();
    const email = (data.get("email") || "").trim();
    const phone = (data.get("contact_no") || "").trim();
    const message = (data.get("message") || "").trim();

    // Your deployed Google Apps Script Web App URL
    const GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbya4T9nDTIAuqTfPQaJAHGiSwPUwTabkCtD3StxIDv_wGyVo93WBBvgGu37pvu3-kFv/exec";

    if(submitButton){
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    if(status){
      status.hidden = true;
      status.textContent = "";
    }

    try {

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          first_name: first,
          last_name: last,
          email: email,
          contact_no: phone,
          message: message,
          website: ""
        }),
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        }
      });

      const result = await response.json();

      if(!result.success){
        throw new Error(
          result.error || "Unable to send consultation request."
        );
      }

      // Success
      if(status){
        status.hidden = false;
        status.textContent =
          "Thank you. Your consultation request has been sent successfully.";
      }

      form.reset();

      if(submitButton){
        submitButton.disabled = false;
        submitButton.textContent = "Send consultation request →";
      }

    } catch(error) {

      console.error(
        "Consultation submission error:",
        error
      );

      if(status){
        status.hidden = false;
        status.textContent =
          "We couldn't send your request right now. Please contact us directly.";
      }

      if(submitButton){
        submitButton.disabled = false;
        submitButton.textContent = "Send consultation request →";
      }
    }
  });
}

  // =========================================
  // CLIENT REVIEWS
  // =========================================

  const reviewsContainer = document.querySelector("#client-reviews");

  if (reviewsContainer) {

    const REVIEWS_API_URL =
      "https://script.google.com/macros/s/AKfycbzbiWQX4FeMSjG6yax2-_mlLTCJzTN7zM_jsPMsiHOw9EBN8UYExsp6QtdU_2f_Znrc/exec";

    async function loadClientReviews() {

      try {

        const response = await fetch(REVIEWS_API_URL);

        if (!response.ok) {
          throw new Error("Unable to fetch reviews.");
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.reviews)) {
          throw new Error("Invalid reviews response.");
        }

        // // Clear loading message
        // reviewsContainer.innerHTML = "";

        // // No approved reviews yet
        // if (result.reviews.length === 0) {

        //   reviewsContainer.innerHTML = `
        //     <div class="reviews-empty">
        //       <p>No client stories have been published yet.</p>
        //     </div>
        //   `;

        //   return;
        // }

        // Create review cards
        result.reviews.forEach((item, index) => {

          const article = document.createElement("article");

          article.className =
            "testimonial reveal" +
            (index % 3 === 1 ? " delay-1" : "") +
            (index % 3 === 2 ? " delay-2" : "");

          // Convert rating into stars
          const rating = Math.max(
            0,
            Math.min(5, parseInt(item.rating, 10) || 0)
          );

          const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

          article.innerHTML = `
            <div class="stars">${stars}</div>

            <p>
              “${escapeReviewText(item.review)}”
            </p>

            <small>
              ${escapeReviewText(item.name)}
            </small>
          `;

          reviewsContainer.appendChild(article);

          // Trigger the same reveal animation
          requestAnimationFrame(() => {
            article.classList.add("visible");
          });
        });

      } catch (error) {

        console.error(
          "Client reviews loading error:",
          error
        );

        reviewsContainer.innerHTML = `
          <div class="reviews-empty">
            <p>Client reviews are currently unavailable.</p>
          </div>
        `;
      }
    }


    // Prevent review text from inserting HTML into the page
    function escapeReviewText(value) {

      const div = document.createElement("div");

      div.textContent = value || "";

      return div.innerHTML;
    }


    loadClientReviews();
  }

   // =========================================
  // MANUAL TESTIMONIAL NAVIGATION
  // =========================================

  const testimonialTrack =
    document.querySelector("#client-reviews");

  const testimonialPrev =
    document.querySelector(".testimonial-prev");

  const testimonialNext =
    document.querySelector(".testimonial-next");

function moveTestimonials(direction) {

  if (!testimonialTrack) {
    return;
  }

  const cards =
    testimonialTrack.querySelectorAll(".testimonial");

  if (!cards.length) {
    return;
  }

  const firstCard = cards[0];

  const cardWidth =
    firstCard.getBoundingClientRect().width;

  const styles =
    window.getComputedStyle(testimonialTrack);

  const gap =
    parseFloat(styles.columnGap) ||
    parseFloat(styles.gap) ||
    0;


  /*
   * Desktop:
   * 3 cards visible → move 3 cards.
   *
   * Tablet:
   * 2 cards visible → move 2 cards.
   *
   * Mobile:
   * 1 card visible → move 1 card.
   */

  let cardsToMove = 1;

  if (window.innerWidth > 1000) {
    cardsToMove = 3;
  } else if (window.innerWidth > 650) {
    cardsToMove = 2;
  }


  const amount =
    (cardWidth + gap) * cardsToMove;


  testimonialTrack.scrollTo({
    left:
      testimonialTrack.scrollLeft +
      (direction * amount),

    behavior: "smooth"
  });
}


  testimonialPrev?.addEventListener(
    "click",
    () => {
      moveTestimonials(-1);
    }
  );


  testimonialNext?.addEventListener(
    "click",
    () => {
      moveTestimonials(1);
    }
  );
});
