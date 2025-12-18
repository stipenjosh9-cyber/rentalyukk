import gsap from 'gsap';

export class UIAnimator {
    public static animateEntry(elementSelector: string, stagger: number = 0.05) {
        gsap.fromTo(elementSelector,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, stagger: stagger, ease: "power2.out" }
        );
    }

    public static animateModalOpen(modalContent: HTMLElement) {
        gsap.fromTo(modalContent,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
    }

    public static animateNumber(element: HTMLElement, endValue: number, prefix: string = "") {
        const obj = { val: 0 };
        gsap.to(obj, {
            val: endValue,
            duration: 1,
            ease: "power1.out",
            onUpdate: () => {
                element.textContent = `${prefix}${Math.floor(obj.val).toLocaleString('id-ID')}`;
            }
        });
    }
}
