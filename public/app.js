"use strict";
/*
* This class provides work with the grid.
* These methods are optimized for fast creation of grid cell fields.
*/
class Grid {
    // private weightedCells: pair[][] = new Array(50) as pair[][]
    constructor(idCanvas) {
        this.widthDisplay = window.innerWidth;
        this.heightDisplay = window.innerHeight;
        this.step = 5;
        this.interval = 50;
        this.running = false;
        this.colorGrid = [255, 255, 255];
        this.cells = [];
        this.tickSetinterval = 0;
        this.canvas = document.getElementById(idCanvas);
        this.ctx = this.canvas.getContext('2d');
        // let __weightedCells1Level: pair[] = new Array(100)
        // __weightedCells1Level.fill({x: 0, y: 0})
        // this.weightedCells.fill(__weightedCells1Level)
        // console.log(this.weightedCells)
    }
    ruleActivationWeight(weight) { return weight >= 3; }
    ruleRemovingWeight(weight) { return weight < 2 || weight > 3; }
    // Private methods
    // GENERAL METHODS
    resizeCanvas() {
        this.canvas.width = this.widthDisplay - 2;
        this.canvas.height = this.heightDisplay - 2;
    }
    // DRAW METHODS
    drawGrid(w, h, step) {
        var data = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> \
			 <defs> \
				  <pattern id="smallGrid" width="' + step + '" height="' + step + '" patternUnits="userSpaceOnUse"> \
						<path d="M ' + step + ' 0 L 0 0 0 ' + step + '" fill="none" stroke="rgb(' + this.colorGrid.join(",") + ')" stroke-width="0.5" /> \
				  </pattern> \
				  <pattern id="grid" width="' + step + '0" height="' + step + '0" patternUnits="userSpaceOnUse"> \
						<rect width="' + step + '0" height="' + step + '0" fill="url(#smallGrid)" /> \
						<path d="M ' + step + '0 0 L 0 0 0 ' + step + '0" fill="none" stroke="rgb(' + this.colorGrid.join(",") + ')" stroke-width="1" /> \
				  </pattern> \
			 </defs> \
			 <rect width="100%" height="100%" fill="url(#smallGrid)" /> \
		</svg>';
        var DOMURL = window.URL || window.webkitURL || window;
        var img = new Image();
        var svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
        var url = DOMURL.createObjectURL(svg);
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);
        };
        img.src = url;
    }
    generateColor(min, max) {
        let random = (_min, _max) => { return Math.random() * (_max - _min) + _min; };
        let Color = [random(min, max), random(min, max), random(min, max)];
        return Color;
    }
    paintRect(xCell, yCell) {
        this.ctx.fillStyle = "rgb(" + this.generateColor(0, 255).join(",") + ")";
        this.ctx.fillRect((xCell - 1) * this.step + 1, (yCell - 1) * this.step + 1, this.step - 1, this.step - 1);
    }
    clearRect(xCell, yCell) {
        this.ctx.clearRect((xCell - 1) * this.step + 1, (yCell - 1) * this.step + 1, this.step - 1, this.step - 1);
        // this.drawGrid(this.widthDisplay - 2, this.heightDisplay - 2, this.step)
    }
    clear() {
        this.cells = [];
        this.ctx.clearRect(0, 0, this.widthDisplay - 2, this.heightDisplay - 2);
        this.drawGrid(this.widthDisplay - 2, this.heightDisplay - 2, this.step);
    }
    // WORKS FOR CELLS ARRAY
    addToCells(xCell, yCell) {
        let cell = { x: xCell, y: yCell, weight: 0 };
        this.cells.push(cell);
    }
    popFromCells() {
        return this.cells.pop();
    }
    removeFromCellsByXY(xCell, yCell) {
        this.cells.forEach((cell, index) => {
            var __cell;
            if (cell.x == xCell && cell.y == yCell) {
                __cell = cell;
                this.cells.splice(index, 1);
                return __cell;
            }
        });
        return undefined;
    }
    cellIsContains(cell, pull) {
        const cells = pull || this.cells;
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].x === cell.x && cells[i].y === cell.y)
                return true;
        }
        return false;
    }
    findCell(cell, pull) {
        const cells = pull || this.cells;
        for (let i = 0; i < cells.length; i++) {
            const element = cells[i];
            if (element.x === cell.x && element.y === cell.y)
                return i;
        }
        return -1;
    }
    calcWeights() {
        let cells = [];
        this.cells.forEach((cell) => {
            // 9 - поскольку 8 соседей
            for (let i = 0; i < 9; i++) {
                var dx = 0;
                var dy = 0;
                if (i != 4) {
                    if (i % 3 == 0)
                        dx = -1;
                    else if (i % 3 == 1)
                        dx = 0;
                    else
                        dx = 1;
                    if (Math.floor(i / 3) == 0)
                        dy = -1;
                    else if (Math.floor(i / 3) == 1)
                        dy = 0;
                    else
                        dy = 1;
                    let tmpCell = { x: cell.x + dx, y: cell.y + dy, weight: 1 };
                    if (!this.cellIsContains(tmpCell, cells))
                        cells.push(tmpCell);
                    else
                        cells[this.findCell(tmpCell, cells)].weight += 1;
                }
            }
        });
        return cells;
    }
    // USER ACTIONS
    watchActions() {
        this.canvas.onclick = (e) => {
            let xCell = Math.ceil(e.clientX / this.step);
            let yCell = Math.ceil(e.clientY / this.step);
            let cell = { x: xCell, y: yCell, weight: 0 };
            if (!this.cellIsContains(cell)) {
                this.addToCells(xCell, yCell);
                this.paintRect(xCell, yCell);
            }
            if (e.altKey) {
                this.removeFromCellsByXY(xCell, yCell);
                this.clearRect(xCell, yCell);
            }
        };
    }
    // Public methods
    dump() {
        console.log(this.cells);
    }
    nextTick() {
        const weights = this.calcWeights();
        weights.forEach((cell) => {
            if (this.ruleActivationWeight(cell.weight)) {
                if (!this.cellIsContains(cell))
                    this.addToCells(cell.x, cell.y);
                this.paintRect(cell.x, cell.y);
            }
            if (this.ruleRemovingWeight(cell.weight)) {
                this.removeFromCellsByXY(cell.x, cell.y);
                this.clearRect(cell.x, cell.y);
            }
        });
        this.cells.forEach((cell, index) => { this.cells[index].weight = 0; });
    }
    tick(interval) {
        this.tickSetinterval = setInterval(() => {
            this.nextTick();
        }, interval);
    }
    init() {
        this.watchActions();
        this.resizeCanvas();
        this.drawGrid(this.widthDisplay - 2, this.heightDisplay - 2, this.step);
        if (this.running)
            this.tick(this.interval);
    }
}
class UI {
    constructor(...id__icons) {
        this.id__canvas = "app-canvas";
        this.grid = new Grid(this.id__canvas);
        this.id__play = "";
        this.id__stop = "";
        this.id__next = "";
        this.id__dump = "";
        this.id__clear = "";
        this.element__play = null;
        this.element__stop = null;
        this.element__next = null;
        this.element__dump = null;
        this.element__clear = null;
        this.id__play = id__icons[0];
        this.id__stop = id__icons[1];
        this.id__next = id__icons[2];
        this.id__dump = id__icons[3];
        this.id__clear = id__icons[4];
    }
    init() {
        const element__play = document.getElementById(this.id__play);
        const element__stop = document.getElementById(this.id__stop);
        const element__next = document.getElementById(this.id__next);
        const element__dump = document.getElementById(this.id__dump);
        const element__clear = document.getElementById(this.id__clear);
        this.grid.init();
        console.log(this.grid);
        this.watch(element__play, element__stop, element__next, element__dump, element__clear);
    }
    toPlay() {
        this.grid.tick(this.grid.interval);
    }
    toStop() {
        clearInterval(this.grid.tickSetinterval);
    }
    toNext() {
        this.grid.nextTick();
    }
    toDump() {
        this.grid.dump();
    }
    watch(...elements) {
        elements[0].onclick = (e) => { this.toPlay(); };
        elements[1].onclick = (e) => { this.toStop(); };
        elements[2].onclick = (e) => { this.toNext(); };
        elements[3].onclick = (e) => { this.toDump(); };
        elements[4].onclick = (e) => { this.grid.clear(); };
    }
}
const ui = new UI("play", "stop", "next", "dump", "clear");
ui.init();
