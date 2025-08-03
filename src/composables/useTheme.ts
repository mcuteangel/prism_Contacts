import { ref } from 'vue';

export function useTheme() {
  const isDark = ref(false);

  const setTheme = (dark: boolean) => {
    isDark.value = dark;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const toggleTheme = () => setTheme(!isDark.value);

  const initTheme = () => {
    setTheme(
      localStorage.getItem('theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  };

  return {
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  };
}
