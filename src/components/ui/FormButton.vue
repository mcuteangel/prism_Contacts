<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    class="btn gap-2"
    :id="$attrs.id"
    :data-testid="$attrs['data-testid']"
    v-on="$attrs"
  >
    <span v-if="loading" class="loading loading-spinner loading-xs"></span>
    <slot></slot>
  </button>
</template>

<script>
import { computed, defineComponent } from 'vue';

export default defineComponent({
  name: 'FormButton',
  inheritAttrs: false,

  props: {
    'data-testid': {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'button',
      validator: (value) => ['button', 'submit', 'reset'].includes(value),
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) =>
        ['primary', 'secondary', 'success', 'error', 'ghost', 'link'].includes(value),
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value),
    },
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const buttonClasses = computed(() => {
      const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        error: 'btn-error',
        ghost: 'btn-ghost',
        link: 'btn-link',
      };

      const sizes = {
        xs: 'btn-xs',
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
      };

      return [
        variants[props.variant] || '',
        sizes[props.size] || '',
        props.loading ? 'loading' : '',
      ]
        .filter(Boolean)
        .join(' ');
    });

    return {
      buttonClasses,
    };
  },
});
</script>
