const regex = {
    integer: /^[1-9]\d*$/,
    oneTo50: /^([1-4]\d|50|[1-9])$/,
    emoji: /^\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic}$/u,
};

export default regex;
