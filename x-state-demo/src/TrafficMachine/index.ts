import { assign, createMachine } from "xstate";

interface LightContext {
  elapsed: number;
  interval: number;
  light: string;
  outage: boolean;
  walk: boolean;
  walkblink: boolean;
}

type LightEvent =
  | {
      type: "CHANGE";
    }
  | { type: "OUTAGE"; value: boolean }
  | { type: "WALK"; value: boolean };

interface WalkSchema {
  //NEW!!!
  initial: "walk";
  states: {
    walk: {};
    blink: {};
    wait: {};
  };
  onDone: {};
}

interface LightStateSchema {
  states: {
    green: {};
    yellow: {};
    red: WalkSchema; //NEW!!!
    redblink: {};
  };
}

export const lightMachine = createMachine<LightContext, LightStateSchema, LightEvent>(
  {
    //Machine Identifier
    id: "light",

    //Initial state
    initial: "green",

    //local context for entire machine
    context: {
      elapsed: 0,
      interval: 1,
      light: "green",
      outage: false,
      walk: false,
      walkblink: false, //NEW!!
    },

    //State definitions
    states: {
      green: {
        invoke: {
          src: (context) => (cb) => {
            const interval = setInterval(() => {
              cb("CHANGE");
            }, 4000 * context.interval);

            return () => {
              clearInterval(interval);
            };
          },
        },
        on: {
          CHANGE: {
            target: "yellow",
            actions: assign<LightContext>({
              elapsed: (ctx) => 0,
              light: "yellow",
            }),
            cond: "inOutage",
          },
        },
      },
      yellow: {
        invoke: {
          src: (context) => (cb) => {
            const interval = setInterval(() => {
              cb("CHANGE");
            }, 1000 * context.interval);

            return () => {
              clearInterval(interval);
            };
          },
        },
        on: {
          CHANGE: {
            target: "red",
            actions: assign<LightContext>({
              elapsed: (ctx) => 0,
              light: "red",
              walk: true,
            }),
            cond: "inOutage",
          },
        },
      },
      red: {
        initial: "walk",
        states: {
          walk: {
            invoke: {
              src: (context) => (cb) => {
                const interval = setInterval(() => {
                  cb("CHANGE");
                }, 4000 * context.interval);

                return () => {
                  clearInterval(interval);
                };
              },
            },
            on: {
              CHANGE: {
                target: "blink",
                actions: assign<LightContext>({
                  elapsed: (ctx) => 0,
                  walk: false,
                  walkblink: true,
                }),
                cond: "inOutage",
              },
            },
          },
          blink: {
            invoke: {
              src: (context) => (cb) => {
                const interval = setInterval(() => {
                  cb("CHANGE");
                }, 8000 * context.interval);

                return () => {
                  clearInterval(interval);
                };
              },
            },
            on: {
              CHANGE: {
                target: "wait",
                actions: assign<LightContext>({
                  elapsed: (ctx) => 0,
                  walk: false,
                  walkblink: false,
                }),
                cond: "inOutage",
              },
            },
          },
          wait: {
            type: "final",
          },
        },
        onDone: {
          target: "green",
          actions: assign<LightContext>({
            elapsed: (ctx) => 0,
            light: "green",
          }),
        },
        /*invoke: {
          src: (context) => (cb) => {
            const interval = setInterval(() => {
              cb("CHANGE");
            }, 4000 * context.interval);

            return () => {
              clearInterval(interval);
            };
          },
        },
        on: {
          CHANGE: {
            target: "green",
            actions: assign<LightContext>({
              elapsed: (ctx) => 0,
              light: "green",
            }),
            cond: "inOutage",
          },
        },*/
      },
      redblink: {},
    },
    on: {
      OUTAGE: {
        actions: assign<LightContext>({
          light: (ctx) => (ctx.outage ? "green" : "redblink"),
          outage: (ctx) => !ctx.outage,
          walkblink: (ctx) => !ctx.walkblink, //NEW!!!
        }),
      },
      WALK: {
        actions: assign<LightContext>({
          walk: (ctx) => !ctx.walk,
        }),
      },
    },
  },
  {
    guards: {
      inOutage: (context) => {
        return !context.outage;
      },
    },
  }
);
