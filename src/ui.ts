declare global {
    interface Window {
      gsap: any;
    }
}

export class UIManager {
    constructor() {}

    public initAnimations() {
        if (!window.gsap) return;

        // Sidebar Entrance
        window.gsap.from("aside", {
            duration: 1,
            x: -200,
            opacity: 0,
            ease: "power3.out"
        });

        // Main Content Fade In
        window.gsap.from("main", {
            duration: 1,
            y: 20,
            opacity: 0,
            delay: 0.3,
            ease: "power3.out"
        });

        // Cards Stagger
        window.gsap.from(".grid > div", {
            duration: 0.8,
            y: 30,
            opacity: 0,
            stagger: 0.1,
            delay: 0.5,
            ease: "back.out(1.7)"
        });
    }

    public animatePageTransition(newPageId: string) {
        if (!window.gsap) return;
        const page = document.getElementById(`page-${newPageId}`);
        if(page) {
             window.gsap.fromTo(page,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
        }
    }

    public animateModalOpen(modal: HTMLElement) {
        const content = modal.querySelector('.modal-content-area');
        if (content && window.gsap) {
            window.gsap.fromTo(content,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "elastic.out(1, 0.75)" }
            );
        }
    }
}
