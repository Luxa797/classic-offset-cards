// src/hooks/useClickOutside.ts

import { useEffect, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

/**
 * ஒரு கூறின் (component) வெளியே கிளிக் செய்யப்படும்போது ஒரு செயல்பாட்டை இயக்கும் custom hook.
 * @param ref - கண்காணிக்கப்பட வேண்டிய HTML элеменட்டின் ref.
 * @param handler - வெளியே கிளிக் செய்யப்படும்போது இயக்கப்பட வேண்டிய செயல்பாடு.
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: Event) => void
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current;
      // கூறின் உள்ளே அல்லது கூறின் மீதே கிளிக் செய்யப்பட்டால், எதுவும் செய்ய வேண்டாம்
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }
      // வெளியே கிளிக் செய்யப்பட்டால், கொடுக்கப்பட்ட handler செயல்பாட்டை இயக்கவும்
      handler(event);
    };

    // இரண்டு விதமான கிளிக் நிகழ்வுகளையும் கவனிக்கவும் (mouse மற்றும் touch)
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    // கூறு unmount செய்யப்படும்போது, listener-ஐ நீக்கிவிடவும் (memory leak-ஐத் தவிர்க்க)
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // ref அல்லது handler மாறும்போது மட்டும் இந்த effect-ஐ மீண்டும் இயக்கவும்
};