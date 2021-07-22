type pair = {
	x: number,
	y: number,
	weight: number
}
// this type implement rgb color, where opacity (alpha chanell) = 1
type color = [number, number, number]

/*
* This class provides work with the grid. 
* These methods are optimized for fast creation of grid cell fields.
*/
class Grid{
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	public readonly widthDisplay: number = window.innerWidth
	public readonly heightDisplay: number = window.innerHeight
	public readonly step: number = 5
	public readonly interval: number = 50
	public running: boolean = false
	private readonly colorGrid: color = [255, 255, 255]
	private cells: pair[] = []
	public ruleActivationWeight(weight: number): boolean { return weight >= 3 }
	public ruleRemovingWeight(weight: number): boolean { return weight < 2 || weight > 3 }
	public tickSetinterval: number = 0
	// private weightedCells: pair[][] = new Array(50) as pair[][]

	constructor(idCanvas: string) {
		this.canvas = document.getElementById(idCanvas) as
			HTMLCanvasElement;
		this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

		// let __weightedCells1Level: pair[] = new Array(100)
		// __weightedCells1Level.fill({x: 0, y: 0})
		// this.weightedCells.fill(__weightedCells1Level)
		// console.log(this.weightedCells)
	}

	// Private methods

	// GENERAL METHODS
	private resizeCanvas(): void {
		this.canvas.width = this.widthDisplay - 2
		this.canvas.height = this.heightDisplay - 2
	}

	// DRAW METHODS
	private drawGrid (w: number, h: number, step: number): void{
		
		
		var data = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> \
			 <defs> \
				  <pattern id="smallGrid" width="'+ step +'" height="'+ step +'" patternUnits="userSpaceOnUse"> \
						<path d="M '+ step +' 0 L 0 0 0 '+ step +'" fill="none" stroke="rgb('+ this.colorGrid.join(",") +')" stroke-width="0.5" /> \
				  </pattern> \
				  <pattern id="grid" width="'+ step +'0" height="'+ step +'0" patternUnits="userSpaceOnUse"> \
						<rect width="'+ step +'0" height="'+ step +'0" fill="url(#smallGrid)" /> \
						<path d="M '+ step +'0 0 L 0 0 0 '+ step +'0" fill="none" stroke="rgb('+ this.colorGrid.join(",") +')" stroke-width="1" /> \
				  </pattern> \
			 </defs> \
			 <rect width="100%" height="100%" fill="url(#smallGrid)" /> \
		</svg>';
	
		var DOMURL = window.URL || window.webkitURL || window;
		
		var img = new Image();
		var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
		var url = DOMURL.createObjectURL(svg);
		

		img.onload = () => {
		  this.ctx.drawImage(img, 0, 0);
		  DOMURL.revokeObjectURL(url);
		}
		img.src = url;
	}

	public generateColor(min: number, max: number): color{
		let random = (_min: number, _max: number): number => { return Math.random() * (_max - _min) + _min }
		let Color: color = [random(min, max), random(min, max), random(min, max)]
		return Color
	}
	private paintRect(xCell: number, yCell: number): void{
		this.ctx.fillStyle = "rgb(" + this.generateColor(0, 255).join(",") + ")"
		this.ctx.fillRect((xCell - 1) * this.step + 1, (yCell - 1) * this.step + 1, this.step - 1, this.step-1)
	}
	private clearRect(xCell: number, yCell: number): void{
		this.ctx.clearRect((xCell - 1) * this.step + 1, (yCell - 1) * this.step + 1, this.step-1, this.step-1)
		// this.drawGrid(this.widthDisplay - 2, this.heightDisplay - 2, this.step)
	}
	public clear(): void{
		this.cells = []
		this.ctx.clearRect(0, 0, this.widthDisplay - 2, this.heightDisplay - 2)
		this.drawGrid(this.widthDisplay - 2, this.heightDisplay - 2, this.step)
	}

	// WORKS FOR CELLS ARRAY
	private addToCells(xCell: number, yCell: number): void{
		let cell: pair = {x: xCell, y: yCell, weight: 0}
		this.cells.push(cell)
	}

	private popFromCells(): pair | undefined{
		return this.cells.pop()
	}

	private removeFromCellsByXY(xCell: number, yCell: number): pair | undefined{
		this.cells.forEach((cell, index) => {
			var __cell: pair
			if(cell.x == xCell && cell.y == yCell){
				__cell = cell
				this.cells.splice(index, 1)
				return __cell
			}
		})
		return undefined
	}

	private cellIsContains(cell: pair, pull?: pair[]): boolean{
		const cells = pull || this.cells
		for(let i = 0; i < cells.length; i++){
			if(cells[i].x === cell.x && cells[i].y === cell.y)
				return true
		}
		return false
	}

	private findCell(cell: pair, pull?: pair[]): number{
		const cells = pull || this.cells
		for (let i = 0; i < cells.length; i++) {
			const element = cells[i];
			if(element.x === cell.x && element.y === cell.y) return i
		}
		return -1
	}

	private calcWeights(): pair[]{
		let cells: pair[] = []
		this.cells.forEach((cell: pair) => {
			// 9 - поскольку 8 соседей
			for (let i = 0; i < 9; i++) {

				var dx: number = 0
				var dy: number = 0
				if(i != 4){
					if(i % 3 == 0) dx = -1
					else if(i % 3 == 1) dx = 0
					else dx = 1

					if(Math.floor(i / 3) == 0) dy = -1
					else if(Math.floor(i / 3) == 1) dy = 0
					else dy = 1

					let tmpCell: pair = {x: cell.x + dx, y: cell.y + dy, weight: 1}

					if(!this.cellIsContains(tmpCell, cells)) cells.push(tmpCell)
					else cells[this.findCell(tmpCell, cells)].weight += 1

				}
			}
		})
		return cells
	}

	// USER ACTIONS
	private watchActions(): void{
		this.canvas.onclick = (e: MouseEvent) => {

			let xCell: number = Math.ceil(e.clientX / this.step)
			let yCell: number = Math.ceil(e.clientY / this.step)
			let cell: pair = {x: xCell, y: yCell, weight: 0}
			if(!this.cellIsContains(cell)){
				this.addToCells(xCell, yCell)
				this.paintRect(xCell, yCell)
			}
			if(e.altKey){
				this.removeFromCellsByXY(xCell, yCell)
				this.clearRect(xCell, yCell)
			}
		}
	}
	


	// Public methods
	public dump(): void{
		console.log(this.cells)
	}
	public nextTick(): void{
		const weights: pair[] = this.calcWeights()
		weights.forEach((cell: pair) => {
			if(this.ruleActivationWeight(cell.weight)){
				if(!this.cellIsContains(cell)) this.addToCells(cell.x, cell.y)
				this.paintRect(cell.x, cell.y)
			}
			if(this.ruleRemovingWeight(cell.weight)) {
				this.removeFromCellsByXY(cell.x, cell.y)
				this.clearRect(cell.x, cell.y)
			}
		})
		this.cells.forEach((cell: pair, index: number) => { this.cells[index].weight = 0 })
	}

	public tick(interval: number): void{
		this.tickSetinterval = setInterval(() => {
			this.nextTick()
		}, interval)
	}

	public init(): void{
		this.watchActions()
		this.resizeCanvas()
		this.drawGrid(this.widthDisplay - 2, this.heightDisplay - 2, this.step)
		if(this.running) this.tick(this.interval)
	}
}





class UI{
	id__canvas: string = "app-canvas"
	grid: Grid = new Grid(this.id__canvas)

	id__play: string = ""
	id__stop: string = ""
	id__next: string = ""
	id__dump: string = ""
	id__clear: string = ""

	element__play: HTMLElement | null = null
	element__stop: HTMLElement | null = null
	element__next: HTMLElement | null = null
	element__dump: HTMLElement | null = null
	element__clear: HTMLElement | null = null

	constructor(...id__icons: string[]){
		this.id__play = id__icons[0]
		this.id__stop = id__icons[1]
		this.id__next = id__icons[2]
		this.id__dump = id__icons[3]
		this.id__clear = id__icons[4]
	}
	public init(): void{
		const element__play: HTMLElement = document.getElementById(this.id__play) as HTMLElement
		const element__stop: HTMLElement = document.getElementById(this.id__stop) as HTMLElement
		const element__next: HTMLElement = document.getElementById(this.id__next) as HTMLElement
		const element__dump: HTMLElement = document.getElementById(this.id__dump) as HTMLElement
		const element__clear: HTMLElement = document.getElementById(this.id__clear) as HTMLElement

		this.grid.init()
		console.log(this.grid)
		this.watch(element__play, element__stop, element__next, element__dump, element__clear)
	}

	public toPlay(): void{
		this.grid.tick(this.grid.interval)
	}

	public toStop(): void{
		clearInterval(this.grid.tickSetinterval)
	}
	public toNext(): void{
		this.grid.nextTick()
	}
	public toDump(): void{
		this.grid.dump()
	}

	private watch(...elements: HTMLElement[]): void{
		elements[0].onclick = (e: MouseEvent) => { this.toPlay() }
		elements[1].onclick = (e: MouseEvent) => { this.toStop() }
		elements[2].onclick = (e: MouseEvent) => { this.toNext() }
		elements[3].onclick = (e: MouseEvent) => { this.toDump() }
		elements[4].onclick = (e: MouseEvent) => { this.grid.clear() }
	}

}

const ui = new UI("play", "stop", "next", "dump", "clear")
ui.init()
