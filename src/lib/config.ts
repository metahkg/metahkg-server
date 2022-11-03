export interface config {
    register: {
        mode?: "invite" | "domain" | "none" | "default",
        domains?: RegExp[]
    },
    visibility?: "internal" | "public",
}
