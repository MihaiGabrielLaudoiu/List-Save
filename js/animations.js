document.addEventListener('DOMContentLoaded', () => {
    animateElements();
    observeElements();
    initSponsorsSlider();
    if (document.querySelector('.page-nosotros')) {
        initAboutAnimations();
        initTimelineAnimations();
    }
});

function animateElements() {
    var elements = document.querySelectorAll('.animate-fadeIn');
    if (elements.length === 0) return;
    elements.forEach(function(element, index) {
        element.style.opacity = '0';
        setTimeout(function() {
            element.style.opacity = '1';
            element.style.animation = 'fadeIn 0.6s ease forwards';
        }, index * 150);
    });
}

function observeElements() {
    var targets = document.querySelectorAll('.features__item, .stores__grid img');
    if (targets.length === 0) return;
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeIn');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    targets.forEach(function(el) {
        observer.observe(el);
    });
}

document.querySelectorAll('.form__tab').forEach(function(tab) {
    tab.addEventListener('click', function(e) {
        e.preventDefault();
        var tabs = document.querySelectorAll('.form__tab');
        tabs.forEach(function(t) { t.classList.remove('form__tab--active'); });
        tab.classList.add('form__tab--active');
        var progressBar = document.querySelector('.progress__bar');
        if (progressBar) {
            var progress = Array.from(tabs).indexOf(tab) / (tabs.length - 1) * 100;
            progressBar.style.width = progress + '%';
        }
    });
});

function initSponsorsSlider() {
    var track = document.querySelector('.sponsors__track');
    if (!track) return;

    var sponsorsGroup = track.querySelector('.sponsors__group');
    if (!sponsorsGroup) return;
    for (var i = 0; i < 3; i++) {
        var clone = sponsorsGroup.cloneNode(true);
        track.appendChild(clone);
    }

    var speed = sponsorsGroup.offsetWidth / 50;
    if (speed < 1) speed = 30;
    track.style.animation = 'slideSponsors ' + speed + 's linear infinite';

    track.addEventListener('mouseenter', function() {
        track.style.animationPlayState = 'paused';
    });

    track.addEventListener('mouseleave', function() {
        track.style.animationPlayState = 'running';
    });
}

function initAboutAnimations() {
    var targets = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
    if (targets.length === 0) return;
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = entry.target.dataset.delay || '0s';
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    targets.forEach(function(el, index) {
        el.style.animationPlayState = 'paused';
        el.dataset.delay = (index * 0.15) + 's';
        observer.observe(el);
    });
}

function initTimelineAnimations() {
    var timelineItems = document.querySelectorAll('.timeline__item');
    if (timelineItems.length === 0) {
        return;
    }

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var item = entry.target;
                var idx = Array.from(timelineItems).indexOf(item);
                setTimeout(function() {
                    item.classList.add('animate');
                }, idx * 150);
                observer.unobserve(item);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-30px'
    });

    timelineItems.forEach(function(item) {
        observer.observe(item);
    });
}