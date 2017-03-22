(function (Ω) {

    "use strict";
    //PrintWriter writer = new PrintWriter("res/riki.txt", "UTF-8");
    
    var Bird = Ω.Entity.extend({
        w: 25,
        h: 15,

        ac: 0,
        jumpAc: -3.5,
        maxGravity: 8,
        gravityAc: 0.4,

        color: 0,

        state: null,
        flapping: 100,
        font: new Ω.Font("res/flapfont.png", 16, 22, "abcdefghijklmnopqrstuvwxyz"),
        font2: new Ω.Font("res/flapfont2.png", 16, 21, "abcdefghijklmnopqrstuvwxyz"),
        sounds: {
            //"hit": new Ω.Sound("res/audio/sfx_hit", 1)
        },

        words: ["s"],
        curWord: "",
        nextWord: "",
        curIdx: 0,

        init: function (x, y, screen) {
            this.curWord = this.chooseWord();
            this.nextWord = this.chooseWord();
            this._super(x, y);
            this.screen = screen;
            this.state = new Ω.utils.State("BORN");
        },

        tick: function () {
            this.state.tick();
            switch (this.state.get()) {
                case "BORN":
                    this.state.set("CRUISING");
                    break;
                case "CRUSING":
                    this.y += Math.sin(Date.now() / 150) * 0.70;
                    this.flapping = 150;
                    //console.log(this.x+" "+this.y+" "+ Ω.env.h +" "+ Ω.env.w);
                    //document.write(this.x+" "+this.y+" "+ Ω.env.h +" "+ Ω.env.w);
                    //document.getElementById("demo").innerHTML = this.x+" "+this.y+" "+ Ω.env.h +" "+ Ω.env.w;
                    break;
                case "RUNNING":
                    if (this.state.first()) {
                        this.ac = this.jumpAc + this.jumpAc;
                        this.flapping = 75;
                    }
                    var oldy = this.y;
                    this.ac = Math.min(this.ac + this.gravityAc, this.maxGravity);
                    this.y = Math.max(5, this.y + this.ac);

                    this.handleKeys();

                    // RIKI: This just takes care of ground hit
                    if (this.y < 0 || this.y > Ω.env.h - 112 - this.h) {
                        this.y = oldy;
                        this.die();
                    }
                    //console.log(this.x+" "+this.y+" "+ Ω.env.h +" "+ Ω.env.w);
                    //document.getElementById("demo").innerHTML = this.x+" "+this.y+" "+ Ω.env.h +" "+ Ω.env.w;
                    break;
                case "DYING":
                    this.nextWord = "please restart";
                    this.ac = Math.min(this.ac + 0.4, 10);
                    if (this.y < Ω.env.h - 112 - this.h) {
                        this.y += this.ac;
                    }
                    this.flapping = 0;
                    //console.log(this.x+" "+this.y+" "+ Ω.env.h +" "+ Ω.env.w);
                    //document.getElementById("demo").innerHTML = this.x+" "+this.y+" "+ Ω.env.h +" "+ Ω.env.w;
                    break;
            }
        },

        makejump: function () {
        	this.ac = this.jumpAc + this.jumpAc;
        },
        
        handleop: function(scores,plays) {
            if (String.fromCharCode(Ω.input.lastKey).toLowerCase() == 'o') {
            	var str="";
            	
            	for(var i=0;i<plays-1;i++){
            		str+=scores[i]+" ";
            	}
            	str+=scores[plays-1];
            	
            	console.log("$$"+ str+"$$");
            	
            }
        },
        
        handleop1: function(scores,plays) {
        	var str="";
        	
        	for(var i=0;i<plays-1;i++){
        		str+=scores[i]+" ";
        	}
        	str+=scores[plays-1];
        	
        	console.log("$$"+ str+"$$");
            	
        },
        handleKeys: function () {
            var rightKey = false;
            if (Ω.input.lastKey) {
            	
                if (String.fromCharCode(Ω.input.lastKey).toLowerCase() === this.curWord[this.curIdx]){
                    this.ac = -7;
                    this.curIdx++;
                    if (this.curIdx > this.curWord.length - 1) {
                        this.curIdx = 0;
                        this.curWord = this.nextWord;
                        this.nextWord = this.chooseWord();
                    }
                    rightKey = true;
                }
                Ω.input.lastKey = null;
            }
            return rightKey;
        },
        
        chooseWord: function () {
            return this.words[0];
        },

        setColor: function (color) {
            this.color = color;
        },

        die: function () {
            if (this.screen.state.is("RUNNING")) {
                //this.sounds.hit.play();
                this.screen.state.set("DYING");
                this.state.set("DYING");
                this.ac = 0;
            }
        },

        hit: function (p) {
            this.die();
        },

        render: function (gfx) {

            var c = gfx.ctx;

            window.game.atlas.render(
                gfx,
                "bird" + this.color + "_" + Ω.utils.toggle(this.flapping, 3),
                this.x - 11,
                this.y - 17);

            c.fillStyle = "rgba(0, 0, 0, 0.4)";
            c.fillRect(0, 0, gfx.w, 70);

            var w = gfx.w / 2,
                ww = this.curWord.length * 17 / 2,
                ww2 = this.nextWord.length * 17 / 2;

            for (var i = 0; i < this.curWord.length; i++) {
                var font = i === this.curIdx ? this.font2 : this.font;
                font.write(gfx, "press "+this.curWord[i], w*.65 - ww + (i * 17), 10);
            }
            
            for (var i = 0; i < this.nextWord.length; i++) {
            	//if(this.curWord[i].length > 2){
            		this.font.write(gfx, this.nextWord[i], w - ww2 + (i * 17), 40);
            	//}
            }

        }
    });

    window.Bird = Bird;

}(window.Ω));