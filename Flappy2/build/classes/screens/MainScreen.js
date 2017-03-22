(function (Ω) {

    "use strict";

    var MainScreen = Ω.Screen.extend({

        speed: 2,
        bird: null,
        pipes: null,

        score: 0,
        state: null,

        bg: 0,
        bgOffset: 0,

        sounds: {
            "point": new Ω.Sound("res/audio/sfx_point", 1)
        },

        shake: null,
        flash: null,
        
        
        stateCurr: {"v": 0, "h": 0},
		stateOld: {"v": 0, "h": 0},
		epsilon: 1.00,
		decay: 0.5,
		currAction: "stay",
		prevAction: "stay",
		blockSize: 4,
		rho: 0.5,
		vertical_dist_range: [-350, 190],
		horizontal_dist_range: [0, 180],
		reward:1,
		penalty:-1000,
		startup:0,
		gameplay:0,
		
		max_diff: 9999, 
		min_diff: -9999, 

        init: function () {
            this.reset();
            
            this.startup = 0;
            //RIKI: INITIALIZING Q FUNCTION
			console.log("<------ INSTANTIATING Q VALUES ------>");

			this.Q = new Array();
			this.Scores = new Array();
			for (var i = 0; i < (this.vertical_dist_range[1] - this.vertical_dist_range[0])/this.blockSize; i++) {
				this.Q[i] = new Array();

				// Horizontal Distance
				for (var j = 0; j < (this.horizontal_dist_range[1] - this.horizontal_dist_range[0])/this.blockSize; j++) {
					this.Q[i][j] = {"fly": 0, "stay": 0};
				}
			}

			//console.log(this.Q);
        },

        reset: function () {
            this.score = 0;
            var offset = Ω.env.w * 1;
            this.state = new Ω.utils.State("BORN");
            this.bird = new window.Bird(Ω.env.w * 0.24, Ω.env.h * 0.46, this);
            this.bg = Ω.utils.rand(2);
            this.bird.setColor(Ω.utils.rand(3));
            this.pipes = [
                new window.Pipe(0, "up", offset + Ω.env.w, Ω.env.h - 170, this.speed),
                new window.Pipe(0, "down", offset + Ω.env.w, - 100, this.speed),

                new window.Pipe(1, "up", offset + (Ω.env.w * 1.6), Ω.env.h - 170, this.speed),
                new window.Pipe(1, "down", offset + (Ω.env.w * 1.6), - 100, this.speed),

                new window.Pipe(2, "up", offset + (Ω.env.w * 2.2), Ω.env.h - 170, this.speed),
                new window.Pipe(2, "down", offset + (Ω.env.w * 2.2), - 100, this.speed)
            ];

            this.setHeight(0);
            this.setHeight(1);
            this.setHeight(2);
        },

        tick: function () {
        	
            var returnVal=0;
        	var valid = false;
        	
            this.state.tick();

            this.bird.tick();
            
        	
            switch (this.state.get()) {
                case "BORN":
                    this.state.set("RUNNING");
                    this.bird.state.set("CRUSING");
                    break;
                /*case "GETREADY":
                    if (this.state.count > 30 && this.bird.handleKeys()) {
                        this.bird.state.set("RUNNING");
                        this.state.set("RUNNING");
                    }
                    this.moveLand();
                    break;*/
                case "RUNNING":
                	if (this.state.first()) {
						this.bird.state.set("RUNNING");
					}
                    this.tick_RUNNING();
                    
                    valid = true;
                    returnVal = this.reward;
                    break;
                case "DYING":
                    /*if (this.state.first()) {
                        this.shake = new Ω.Shake(30);
                        this.flash = new Ω.Flash(6);
                    }*/
                    //if (this.state.count > 20) {
                    this.state.set("GAMEOVER");
                    //}
                    
                    this.Scores[this.gameplay] = this.score;
                    this.gameplay+=1;
                    valid = true;
                    returnVal = this.penalty;
                    break;
                case "GAMEOVER":
                	if (this.state.first()) {
						if (this.score > window.game.best) {
							window.game.best = this.score;
							document.getElementById("demo").innerHTML = "HIGHEST SCORE: "+this.score;
						}
					}
                	
                    this.reset();
					this.state.set("BORN");
                    break;
            }
            
            
            // RIKI: MAIN RL FUNCTION
            
            
            if(valid) {
            	
            	// RIKI: GETTING CURRENT STATE
            	var horizontal_distance = this.max_diff;
            	var vertical_distance = this.max_diff;
            	
				for (var i = 0; i < 6; i++) {
					if (this.pipes[i].dir == "up" && this.pipes[i].x + this.pipes[i].w >= this.bird.x) {
						var diff = (this.pipes[i].x + this.pipes[i].w - this.bird.x);
						if (diff < horizontal_distance) {
							horizontal_distance = diff;
							vertical_distance = (this.bird.y - this.pipes[i].y);
						}
					}
				}
            	
	            // GET BLOCK NUMBER
	            var currVBucket;
	            var currHBucket;
	            
	            
	            currVBucket= Math.max( Math.min ( 
								Math.floor((this.vertical_dist_range[1]-this.vertical_dist_range[0]-1)/this.blockSize), 
								Math.floor( (vertical_distance - this.vertical_dist_range[0])/this.blockSize )
							), 0 );
	            
	            currHBucket = Math.max( Math.min ( 
								Math.floor((this.horizontal_dist_range[1]-this.horizontal_dist_range[0]-1)/this.blockSize), 
								Math.floor( (horizontal_distance - this.horizontal_dist_range[0])/this.blockSize )
							), 0 );
	            
	            this.stateCurr.v = currVBucket;
	            this.stateCurr.h = currHBucket;
	            
	            // RIKI: EPSILON GREEDY
	            // RIKI: PICKING NEXT ACTION IF NOT DEAD
	            this.epsilon = this.epsilon*this.decay;
	            /*if(this.epsilon<.001) {
	            	console.log("I HAVE REACHED END OF RANDOMNESS");
	            }*/
	            if(returnVal > 0) {
		            
		            if (Math.random() < this.epsilon) {
						this.currAction = Ω.utils.rand(2) == 0 ? "stay" : "fly";
					} else {
						var flyVal = this.Q[this.stateCurr.v][this.stateCurr.h]["fly"];
						var stayVal = this.Q[this.stateCurr.v][this.stateCurr.h]["stay"]
						this.currAction = flyVal > stayVal ? "fly" : "stay";
					}
	            }
	            
	            
	            if(this.startup>0) {
            		
            		/*DO UPDATING OF Q VALUE*/
            		/*stateCurr v and h should hold the bucket numbers in them*/
	            	if(returnVal > 0) {
		            	this.Q[this.stateOld.v][this.stateOld.h][this.prevAction]+=
		            		this.rho*(returnVal+ this.Q[this.stateCurr.v][this.stateCurr.h][this.currAction]
		            		- this.Q[this.stateOld.v][this.stateOld.h][this.prevAction]);
	            	} else if (returnVal == this.penalty) {
	            		
	            		this.Q[this.stateOld.v][this.stateOld.h][this.prevAction]+=this.rho*(returnVal
	            				- this.Q[this.stateOld.v][this.stateOld.h][this.prevAction]);
	            		//console.log("Q "+this.stateOld.v + " "+this.stateOld.h +" is now "+ this.Q[this.stateOld.v][this.stateOld.h][this.prevAction]+" "+this.prevAction+" "+this.currAction);
	            	}
            	}
	            
	            // RIKI: APPLYING THE ACTION
	            if(returnVal > 0) {
		            if (this.currAction == "fly") {
						this.bird.makejump();
					}
            	}
	            
	            // RIKI: ASKING FOR SCORES
	            this.bird.handleop(this.Scores, this.gameplay);
	            
	            
	            this.stateOld = clone(this.stateCurr);
	            this.prevAction = this.currAction;
	            
	            if(returnVal == this.penalty) {
	            	this.startup=0;
	            	this.stateCurr= {"v": 0, "h": 0};
	        		this.stateOld= {"v": 0, "h": 0};
	        		this.currAction = "stay";
	        		this.prevAction = "stay";
	        		returnVal = 0;
	            } else {
	            	this.startup=7;
	            }
            }
            
            
            
            if (this.shake && !this.shake.tick()) {
                this.shake = null;
            }
            if (this.flash && !this.flash.tick()) {
                this.flash = null;
            }
            //this.bird.makejump();

        },

        tick_RUNNING: function () {

            this.moveLand();

            this.pipes = this.pipes.filter(function (p) {
                p.tick();
                if (!p.counted && p.x < this.bird.x) {
                    p.counted = true;
                    this.score += 0.5;
                    this.sounds.point.play();
                }

                if (p.reset) {
                    this.setHeight(p.group);
                }
                return true;
            }, this);

            Ω.Physics.checkCollision(this.bird, this.pipes);
            /*document.getElementById("demo").innerHTML += "<br>" + this.bird.x+"   "+this.bird.y+"   "+
            this.pipes[0].h +"   "+ this.pipes[0].w+"   "+ this.pipes[0].x+"   "+ this.pipes[0].y;*/
        },

        moveLand: function () {
            this.bgOffset -= this.speed;
            if (this.bgOffset < -Ω.env.w) {
                this.bgOffset += Ω.env.w;
            }
        },

        setHeight: function (group) {
            var h = (Math.random() * 160 | 0) + 130;
            this.pipes.filter(function (p) {
                return p.group === group;
            }).forEach(function (p) {
                p.y = p.dir == "up" ? h + 65 : h - p.h - 65;
            });
        },

        render: function (gfx) {
            var atlas = window.game.atlas;

            gfx.ctx.save();

            this.shake && this.shake.render(gfx);

            this.renderBG(gfx, atlas);

            this.renderGame(gfx, atlas);

            switch (this.state.get()) {
                case "GETREADY":
                    this.renderGetReady(gfx, atlas);
                    this.renderFG(gfx, atlas);
                    break;
                case "GAMEOVER":
                    this.renderFG(gfx, atlas);
                    this.renderGameOver(gfx, atlas);
                    break;
                case "RUNNING":
                    this.renderRunning(gfx, atlas);
                    this.renderFG(gfx, atlas);
                    break;
                default:
                    this.renderFG(gfx, atlas);
                    break;
            }


            gfx.ctx.restore();

            this.flash && this.flash.render(gfx);

        },

        renderBG: function (gfx, atlas) {
            atlas.render(gfx, "bg_" + (this.bg === 1 ? "night" : "day"), 0, 0);
        },

        renderGame: function (gfx) {
            this.pipes.forEach(function (p) {
                p.render(gfx);
            });
            this.bird.render(gfx);
        },

        renderFG: function (gfx, atlas) {
            atlas.render(gfx, "land", this.bgOffset, gfx.h - 112);
            atlas.render(gfx, "land", Ω.env.w + this.bgOffset, gfx.h - 112);
        },

        renderRunning: function (gfx, atlas) {
            if (this.state.count < 30) {
                gfx.ctx.globalAlpha = 1 - (this.state.count / 30);
                this.renderGetReady(gfx, atlas);
                gfx.ctx.globalAlpha = 1;
            }
            this.renderScore(gfx, atlas);
        },

        renderGameOver: function (gfx, atlas) {

            var count = this.state.count,
                yOff;

            if (count > 20) {
                yOff = Math.min(5, count - 20);
                atlas.render(gfx, "text_game_over", 40, gfx.h * 0.24 + yOff);
            }

            if (count > 70) {
                yOff = Math.max(0, 330 - (count - 70) * 20);
                atlas.render(gfx, "score_panel", 24, gfx.h * 0.38 + yOff);
                var sc = this.score + "",
                    right = 218;
                for (var i = 0; i < sc.length; i++) {
                    atlas.render(gfx, "number_score_0" + sc[sc.length - i - 1], right - i * 16, 231 + yOff);
                }

                sc = window.game.best + "";
                for (i = 0; i < sc.length; i++) {
                    atlas.render(gfx, "number_score_0" + sc[sc.length - i - 1], right - i * 16, 272 + yOff);
                }

                var medal = "";
                if (this.score >= 5) medal = "3";
                if (this.score >= 10) medal = "2";
                if (this.score >= 20) medal = "1";
                if (this.score >= 30) medal = "0";
                if (medal) {
                    atlas.render(gfx, "medals_" + medal, 55, 240 + yOff);
                }

                /*if (this.newBest) {
                    atlas.render(gfx, "new", 165, 255 + yOff);
                }*/
            }

            if (count > 100) {
                atlas.render(gfx, "button_play", 20, gfx.h - 172);
                atlas.render(gfx, "button_score", 152, gfx.h - 172);
            }
        },

        renderGetReady: function (gfx, atlas) {
            //atlas.render(gfx, "text_ready", 46, gfx.h * 0.285);
            //atlas.render(gfx, "tutorial", 88, gfx.h * 0.425);

            this.renderScore(gfx, atlas);
        },

        renderScore: function (gfx, atlas) {
            var sc = this.score + "";
            for (var i = 0; i < sc.length; i++) {
                atlas.render(gfx, "font_0" + (48 + parseInt(sc[i], 10)), i * 18 + 130, gfx.h * 0.16);
            }
        }
    });

    window.MainScreen = MainScreen;

}(window.Ω));

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
