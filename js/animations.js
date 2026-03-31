document.addEventListener('DOMContentLoaded', () => {
    animateElements();
    observeElements();
    initSponsorsSlider();
    if (document.querySelector('.page-hero') || document.querySelector('.page-nosotros')) {
        initAboutAnimations();
        initTimelineAnimations();
    }
});

function animateElements() {
    const elements = document.querySelectorAll('.animate-fadeIn');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.animation = 'fadeIn 0.6s ease forwards';
        }, index * 200);
    });
}

function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeIn');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.features__item, .stores__grid img').forEach(el => {
        observer.observe(el);
    });
}

document.querySelectorAll('.form__tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabs = document.querySelectorAll('.form__tab');
        tabs.forEach(t => t.classList.remove('form__tab--active'));
        tab.classList.add('form__tab--active');
        const progress = Array.from(tabs).indexOf(tab) / (tabs.length - 1) * 100;
        document.querySelector('.progress__bar').style.width = `${progress}%`;
    });
});

function initSponsorsSlider() {
    const track = document.querySelector('.sponsors__track');
    if (!track) return;

    const sponsorsGroup = track.querySelector('.sponsors__group');
    for (let i = 0; i < 3; i++) {
        const clone = sponsorsGroup.cloneNode(true);
        track.appendChild(clone);
    }

    const speed = sponsorsGroup.offsetWidth / 50;
    track.style.animation = `slideSponsors ${speed}s linear infinite`;

    const resetAnimation = () => {
        track.style.animation = 'none';
        track.offsetHeight;
        track.style.animation = `slideSponsors ${speed}s linear infinite`;
    };

    track.addEventListener('mouseenter', () => {
        track.style.animationPlayState = 'paused';
    });

    track.addEventListener('mouseleave', () => {
        track.style.animationPlayState = 'running';
    });

    track.addEventListener('animationend', resetAnimation);
}

function initAboutAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = entry.target.dataset.delay || '0s';
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach((el, index) => {
        el.style.animationPlayState = 'paused';
        el.dataset.delay = `${index * 0.2}s`;
        observer.observe(el);
    });
}

function initTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline__item');
    if (timelineItems.length === 0) {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                setTimeout(() => {
                    item.classList.add('animate');
                }, Array.from(timelineItems).indexOf(item) * 200);
                observer.unobserve(item);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-50px'
    });

    timelineItems.forEach(item => {
        observer.observe(item);
    });
}