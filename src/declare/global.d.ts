declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_BASE_URL: string;
  }
}
