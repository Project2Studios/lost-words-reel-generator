
import { EmitterConfigV3 } from '@pixi/particle-emitter';

export const dustEffect: EmitterConfigV3 = {
    "lifetime": {
        "min": 2,
        "max": 5
    },
    "frequency": 0.1,
    "emitterLifetime": -1,
    "maxParticles": 500,
    "addAtBack": false,
    "pos": {
        "x": 0,
        "y": 0
    },
    "behaviors": [
        {
            "type": "alpha",
            "config": {
                "alpha": {
                    "list": [
                        {
                            "time": 0,
                            "value": 0.1
                        },
                        {
                            "time": 0.5,
                            "value": 0.3
                        },
                        {
                            "time": 1,
                            "value": 0
                        }
                    ]
                }
            }
        },
        {
            "type": "moveSpeed",
            "config": {
                "speed": {
                    "list": [
                        {
                            "time": 0,
                            "value": 20
                        },
                        {
                            "time": 1,
                            "value": 10
                        }
                    ]
                }
            }
        },
        {
            "type": "scale",
            "config": {
                "scale": {
                    "list": [
                        {
                            "time": 0,
                            "value": 0.1
                        },
                        {
                            "time": 1,
                            "value": 0.3
                        }
                    ]
                },
                "minMult": 1
            }
        },
        {
            "type": "rotation",
            "config": {
                "accel": 0,
                "minSpeed": 0,
                "maxSpeed": 20,
                "minStart": 0,
                "maxStart": 360
            }
        },
        {
            "type": "spawnShape",
            "config": {
                "type": "rect",
                "data": {
                    "x": 0,
                    "y": 0,
                    "w": 1080,
                    "h": 1350
                }
            }
        },
        {
            "type": "textureSingle",
            "config": {
                "texture": null
            }
        }
    ]
};

export const snowEffect: EmitterConfigV3 = {
    "lifetime": {
        "min": 5,
        "max": 10
    },
    "frequency": 0.05,
    "emitterLifetime": -1,
    "maxParticles": 1000,
    "addAtBack": false,
    "pos": {
        "x": 0,
        "y": 0
    },
    "behaviors": [
        {
            "type": "alpha",
            "config": {
                "alpha": {
                    "list": [
                        {
                            "time": 0,
                            "value": 0.8
                        },
                        {
                            "time": 1,
                            "value": 0.1
                        }
                    ]
                }
            }
        },
        {
            "type": "moveSpeed",
            "config": {
                "speed": {
                    "list": [
                        {
                            "time": 0,
                            "value": 200
                        },
                        {
                            "time": 1,
                            "value": 100
                        }
                    ]
                }
            }
        },
        {
            "type": "scale",
            "config": {
                "scale": {
                    "list": [
                        {
                            "time": 0,
                            "value": 0.2
                        },
                        {
                            "time": 1,
                            "value": 0.5
                        }
                    ]
                },
                "minMult": 1
            }
        },
        {
            "type": "rotation",
            "config": {
                "accel": 0,
                "minSpeed": 0,
                "maxSpeed": 200,
                "minStart": 0,
                "maxStart": 360
            }
        },
        {
            "type": "spawnShape",
            "config": {
                "type": "rect",
                "data": {
                    "x": 0,
                    "y": -100,
                    "w": 1080,
                    "h": 10
                }
            }
        },
        {
            "type": "textureSingle",
            "config": {
                "texture": null
            }
        }
    ]
};

export const sparklesEffect: EmitterConfigV3 = {
    "lifetime": {
        "min": 0.5,
        "max": 1.5
    },
    "frequency": 0.01,
    "emitterLifetime": -1,
    "maxParticles": 200,
    "addAtBack": false,
    "pos": {
        "x": 0,
        "y": 0
    },
    "behaviors": [
        {
            "type": "alpha",
            "config": {
                "alpha": {
                    "list": [
                        {
                            "time": 0,
                            "value": 1
                        },
                        {
                            "time": 1,
                            "value": 0
                        }
                    ]
                }
            }
        },
        {
            "type": "moveSpeed",
            "config": {
                "speed": {
                    "list": [
                        {
                            "time": 0,
                            "value": 50
                        },
                        {
                            "time": 1,
                            "value": 20
                        }
                    ]
                }
            }
        },
        {
            "type": "scale",
            "config": {
                "scale": {
                    "list": [
                        {
                            "time": 0,
                            "value": 0.3
                        },
                        {
                            "time": 1,
                            "value": 0.1
                        }
                    ]
                },
                "minMult": 1
            }
        },
        {
            "type": "rotation",
            "config": {
                "accel": 0,
                "minSpeed": 0,
                "maxSpeed": 360,
                "minStart": 0,
                "maxStart": 360
            }
        },
        {
            "type": "spawnShape",
            "config": {
                "type": "rect",
                "data": {
                    "x": 0,
                    "y": 0,
                    "w": 1080,
                    "h": 1350
                }
            }
        },
        {
            "type": "textureSingle",
            "config": {
                "texture": null
            }
        }
    ]
};
