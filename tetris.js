//Matrica 10x20 koja predstavlja mrezu za tetris
var grid = [
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
];

//Sedam figura
var shapes = {
	I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
	J: [[2,0,0], [2,2,2], [0,0,0]],
	L: [[0,0,3], [3,3,3], [0,0,0]],
	O: [[4,4], [4,4]],
	S: [[0,5,5], [5,5,0], [0,0,0]],
	T: [[0,6,0], [6,6,6], [0,0,0]],
	Z: [[7,7,0], [0,7,7], [0,0,0]]
};

//Boje za figure
var colors = ["#F92338", "#C973FF", "#a9a9a9", "#FEE356", "#53D504", "#36E0FF", "#F8931D"];

//Ovaj seed se koristi za generisanje "nasumicnih" brojeva pri izboru figura. Sto cini rezultate deterministickim.
var rndSeed = 1;

//Pomjenjive vezane za figure
//koordinate na mrezi i oblik trenutne figure
var currentShape = {x: 0, y: 0, shape: undefined};
//cuvamo oblik sledece figure, ovdje nema potrebe za koordinatama jer njih racunamo samo za trenutni oblik
var upcomingShape;
//"korpa" koju koristimo za cuvanje nasumicne permutacije 7 figura i onda se redom izbacaju
var bag = [];
//indeks korpe, figura na koju smo trenutno dosli
var bagIndex = 0;

//Promjenjive za igru
//Rezultat igre
var score = 0;
//Najbolji rezultat igre
var highScore = 0;
//broj ociscenih redova
var clearedRows = 0;
//najvise ociscenih redova u nekoj igri
var mostClearedRows = 0;
//brzina igre
var speed = 500;
//boolean koji se koristi za naznacavanje promjene brzine
var changeSpeed = false;
//ova promjenjiva cuva trenutno stanje igre koje se moze kasnije ucitati
var saveState;
//ovdje se cuva svako trenutno stanje igre
var roundState;
//niz sa brzinama za igru
var speeds = [500,100,1,0];
//ovo je indeks za niz brzina
var speedIndex = 0;
//boolean kojim govorimo da li je AI aktivan ili korisnik igra
var ai = true;
//boolean koji naznacava da li se izvrasava faza "crtanja" igre ili azuriranja algoritma
var draw = true;
//broj poteza napravljenih do sada
var movesTaken = 0;
//najveci postignuti broj poteza
var mostMoves = 0;
//maksimalni broj poteza dozvoljenih u generaciji
var moveLimit = 500;
//niz koji se sastoji od 7 parametara poteza u genomu
var moveAlgorithm = {};


//Vrijednosti za genetski algoritam
//cuvamo broj genoma, pocetno 50 
var populationSize = 50;
//cuvamo genome u niz
var genomes = [];
//indeks trenutnog genoma u nizu genoma
var currentGenome = -1;
//broj generacije
var generation = 0;
//ovo je arhiva u kojoj cuvamo vrijednosti za generaciju
var archive = {
	populationSize: 0,
	currentGeneration: 0,
	elites: [],   //ovo su najbolji genomi koje smo do sada nasli, imaju najbolji fitnes
	genomes: []   //takodje zelimo i da pratimo sve genome
};
//frekvencija mutacije
var mutationRate = 0.05;
//pomaze u racunanju mutacije, odredjuje koliko daleko moze mutacija da odstupa od pocetne vrijednosti
var mutationStep = 0.2;


//glavna funkcija koja se poziva pri ucitavanju HTML stranice
function initialize() {
	//inicijalizujemo velicinu populacije
	archive.populationSize = populationSize;
	//ovdje uzimamo sledecu figuru za igru iz "korpe"
	nextShape();
	//onda kada odaberemo sledecu figuru zelimo da je postavimo na mrezu
	applyShape();
	//ovdje cuvamo trenutno stanje
	saveState = getState();
	roundState = getState();
	//kreiramo inicijalnu populaciju genoma
	createInitialPopulation();
	//petlja igre
	var loop = function(){
		//boolean za mijenjanje brzine
		if (changeSpeed) {
			//resetujemo sat
			//prvo se zaustavlja vrijeme
			clearInterval(interval);
			//a onda podesavamo novi interval, tj brzinu
			interval = setInterval(loop, speed);
			//ali ga ne mijenjamo odma ovdje
			changeInterval = false;
		}
		if (speed === 0) {
			//ako je brzina nula ne zelimo da crtamo nista jer je igra zaustavljena
			draw = false;
			//azuriramo igru (azurira se fitnes, pravi se potez, procjenjuje se sledeci potez)
			update();
			update();
			update();
		} else {
			//ako brzina nije nula, onda se nastavlja crtanje elemenata
			draw = true;
		}
		//vrsimo azuriranje igre svakako, cak i ako nema promjene brzine
		update();
		if (speed === 0) {
			//sad crtamo elemente
			if(movesTaken % 100 === 0) draw = true;
			//draw = true;
			//i azuriramo rezultat igre
			updateScore();
		}
	};
	//interval tajmera
	var interval = setInterval(loop, speed);
}
document.onLoad = initialize();



window.onkeydown = function (event) {

	var characterPressed = String.fromCharCode(event.keyCode);
	if (event.keyCode == 38) {
		rotateShape();
	} else if (event.keyCode == 17) {
		var archiveJSON = $.ajax({
          url: "./archive.json",
          async: false
        }).responseText;
        loadArchive(archiveJSON);
        alert("Arhiva uspjesno ucitana!");
	} else if (event.keyCode == 40) {
		moveDown();
	} else if (event.keyCode == 37) {
		moveLeft();
	} else if (event.keyCode == 39) {
		moveRight();
	} else if (characterPressed.toUpperCase() == "Q") {
		saveState = getState();
	} else if (characterPressed.toUpperCase() == "W") {
		loadState(saveState);
	} else if (characterPressed.toUpperCase() == "D") {
		//uspori igru
		speedIndex--;
		if (speedIndex < 0) {
			speedIndex = speeds.length - 1;
		}
		speed = speeds[speedIndex];
		changeSpeed = true;
	} else if (characterPressed.toUpperCase() == "E") {
		//ubrzaj igru
		speedIndex++;
		if (speedIndex >= speeds.length) {
			speedIndex = 0;
		}
		//podesi indeks brzine
		speed = speeds[speedIndex];
		changeSpeed = true;
		//Ukljuci/Iskljuci AI
	} else if (characterPressed.toUpperCase() == "A") {
		ai = !ai;
	} else if (characterPressed.toUpperCase() == "R") {
		//ucitaj sacuvane vrijednosti generacije
		loadArchive(prompt("Unesite arhivu:"));
	} else if (characterPressed.toUpperCase() == "G") {
		if (localStorage.getItem("archive") === null) {
			alert("Arhiva nije sacuvana. Arhive se cuvaju kada prodje citava generacija, i ostaju tokom svih sesija. Probajte ponovo kada prodje generacija.");
		} else {
			prompt("Arhiva zadnje generacije (ukljucujuci poslednju sesiju):", localStorage.getItem("archive"));
		}
	} else {
		return true;
	}
	//azurira stanje na ekranu posle pritiska dugmeta
	output();
	return false;
};

 //Funkcija za kreiranje inicijalne populacije genoma, svaki sa nasumicnim genima.
 function createInitialPopulation() {
 	//inicijalizujemo niz u kojem cuvamo pocetne genome
 	genomes = [];
 	
 	for (var i = 0; i < populationSize; i++) {
 		//nasumicno inicijalizujemo 7 vrijednosti koje cine genom
 		//ovo su sve tezinske vrijednosti koje se azuriraju kroz evoluciju
 		var genome = {
 			//jedinstevnei identifikator genoma
 			id: Math.random(),
 			//Tezina svakog ociscenog reda u odredjenom potezu. Sto je vise redova ocisceno, ova tezina ce biti veca			
 			rowsCleared: Math.random() - 0.5,
 			//visina najvise kolone na stepen 1.5
			//kako bi algoritam mogao da detektuje da li se blokovi slazu previsoko
 			//weightedHeight: Math.random() - 0.5,
 			//Suma visina svih kolona
 			cumulativeHeight: Math.random() - 0.5,
 			//visina najvece kolone minus visina najnize kolone
 			//relativeHeight: Math.random() - 0.5,
 			//suma svih praznih celija koje imaju figuru iznad sebe (znaci celije koje se ne mogu popuniti)			
 			holes: Math.random() - 0.5,
 			//suma apsolutnih razlika izmedju visina svake kolone
 			roughness: Math.random() - 0.5,
 		};
 		//dodajemo genom u niz genoma
 		genomes.push(genome);
 	}
 	evaluateNextGenome();
 }


 
 //Vrsi se procjena sledeceg genoma u populaciji. Ako smo ih prosli sve, onda se radi evolucija populacije.
 function evaluateNextGenome() {
	//povecavamo indeks za niz genoma
 	currentGenome++;
 	//Ako smo dosli do kraja niza genoma, onda radimo evoluciju populacije
 	if (currentGenome == genomes.length) {
 		evolve();
 	}
 	//ucitavamo trenutno stanje igre kako bi ga sacuvali jer cemo da isprobamo mnogo opcija za dati genom
 	loadState(roundState);
 	//postavimo broj poteza na nulu
 	movesTaken = 0;
	//postavlja se i broj ociscenih redova na nulu
	clearedRows = 0;
 	//i pravimo sledeci potez
 	makeNextMove();
 }

 //Razvija citavu populaciju i prelazi na novu generaciju
 function evolve() {

 	//vracamo pokazivac trenutnog genoma na pocetak nove generacije
	currentGenome = 0;
 	//povecavamo brojac generacije
 	generation++;
 	//resetuje igra, kako bi bila zapoceta nova sa novom generacijom
 	reset();
 	//pamtimo trenutno stanje igre
 	roundState = getState();
 	//sortiramo genome u opadajucem poretku prema fitnesu
	genomes.sort(function(a, b) {
 		return b.fitness - a.fitness;
 	});
 	//add a copy of the fittest genome to the elites list
 	//dodajemo kopiju genoma sa najboljim fitnesom iz generacije u listu "elitnih" genoma
	archive.elites.push(clone(genomes[0]));


	//uklanjamo dio poslednjih genoma iz sortiranog niza genoma, znaci uklanjamo one sa najgorim fitnesom
 	while(genomes.length > populationSize / 2) {
 		genomes.pop();
 	}
 	//suma fitnesa svih preostalih genoma u nizu genoma, vjerovatno nepotrebna
 	var totalFitness = 0;
 	for (var i = 0; i < genomes.length; i++) {
 		totalFitness += genomes[i].fitness;
 	}

	//ovo je u sustini funkcija selekcije, biramo nasumicni genom iz niza genoma
	function getRandomGenome() {
		return genomes[randomWeightedNumBetween(0, genomes.length - 1)];
	}
	//kreiramo niz za djecu
	var children = [];
	//dodajemo genom sa najboljim fitnesom u niz djece
	children.push(clone(genomes[0]));
	//sada pravimo ostalu djecu, dok se niz djece no popuni do velicine populacije
	while (children.length < populationSize) {
		//ovdje se radi crossover izmedju dva nasumicno odabrana genoma iz niza genoma da bi se dobilo dijete
		children.push(makeChild(getRandomGenome(), getRandomGenome()));
	}
	//kreiramo niz za nove genome koje smo sada kreirali kao djecu
	genomes = [];
	//smjestamo djecu u novi niz genoma
	genomes = genomes.concat(children);
	//cuvamo u arhivi ovaj niz genoma
	archive.genomes = clone(genomes);
	//postavljamo i koja je to po redu generacija
	archive.currentGeneration = clone(generation);
	//cuvamo arhivu lokalno u RAM
	localStorage.setItem("archive", JSON.stringify(archive));
}

 //Ova funkcija kreira genom od datih roditeljskih genoma, i onda vrsi mutaciju na dobijenom potomku
 function makeChild(mum, dad) {
	//inicijalizujemo dijete koristeci dva roditeljska genoma
 	var child = {
 		//jedinsteveni id
 		id : Math.random(),
 		//sve ostale parametre nasumicno biramo izmedju dva roditelja
 		rowsCleared: randomChoice(mum.rowsCleared, dad.rowsCleared),
 		//weightedHeight: randomChoice(mum.weightedHeight, dad.weightedHeight),
 		cumulativeHeight: randomChoice(mum.cumulativeHeight, dad.cumulativeHeight),
 		//relativeHeight: randomChoice(mum.relativeHeight, dad.relativeHeight),
 		holes: randomChoice(mum.holes, dad.holes),
 		roughness: randomChoice(mum.roughness, dad.roughness),
 		//za sad dijete nema fitnes
 		fitness: -1
 	};
 	//dio za mutaciju

	//mutiramo svaki parametar koristeci mutationRate i mutationStep
 	if (Math.random() < mutationRate) {
 		child.rowsCleared = child.rowsCleared + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	//if (Math.random() < mutationRate) {
 	//	child.weightedHeight = child.weightedHeight + Math.random() * mutationStep * 2 - mutationStep;
 	//}
 	if (Math.random() < mutationRate) {
 		child.cumulativeHeight = child.cumulativeHeight + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	//if (Math.random() < mutationRate) {
 	//	child.relativeHeight = child.relativeHeight + Math.random() * mutationStep * 2 - mutationStep;
 	//}
 	if (Math.random() < mutationRate) {
 		child.holes = child.holes + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.roughness = child.roughness + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	return child;
 }


 //Ova funkcija vrace niz svih mogucih poteza koji se mogu napraviti u trenutnom stanju, 
 //sa njihovim rejtingom koji odredjujemo koristeci parametre trenutnog genoma.
 function getAllPossibleMoves() {
 	var lastState = getState();
 	var possibleMoves = [];
 	var possibleMoveRatings = [];
 	var iterations = 0;
 	//prolazimo kroz sve moguce rotacije figure
 	for (var rots = 0; rots < 4; rots++) {

 		var oldX = [];
 		//ovo su iteracije za sva moguce pomjeranja lijevo i desno
 		for (var t = -5; t <= 5; t++) {
 			iterations++;
 			loadState(lastState);
 			//rotiramo
 			for (var j = 0; j < rots; j++) {
 				rotateShape();
 			}
 			//pomjera se figura lijevo
 			if (t < 0) {
 				for (var l = 0; l < Math.abs(t); l++) {
 					moveLeft();
 				}
 			//pomjera se figura desno
 			} else if (t > 0) {
 				for (var r = 0; r < t; r++) {
 					moveRight();
 				}
 			}
 			//ako se figura uopste pomjerila
 			if (!contains(oldX, currentShape.x)) {
 				//pomjeramo je dolje
 				var moveDownResults = moveDown();
 				while (moveDownResults.moved) {
 					moveDownResults = moveDown();
 				}
				
				//kao posledicu poteza postavljamo sedam vrijednosti genoma
 				var algorithm = {
 					rowsCleared: clone(clearedRows),//moveDownResults.rowsCleared,
 					//weightedHeight: Math.pow(getHeight(), 1.5),
 					cumulativeHeight: getCumulativeHeight(),
 					//relativeHeight: getRelativeHeight(),
 					holes: getHoles(),
 					roughness: getRoughness()
 				};
 				//racunamo rejting za taj potez, mnozeci parametre poteza sa parametrima trenutnog genoma
 				var rating = 0;
 				rating += algorithm.rowsCleared * genomes[currentGenome].rowsCleared;
 				//rating += algorithm.weightedHeight * genomes[currentGenome].weightedHeight;
 				rating += algorithm.cumulativeHeight * genomes[currentGenome].cumulativeHeight;
 				//rating += algorithm.relativeHeight * genomes[currentGenome].relativeHeight;
 				rating += algorithm.holes * genomes[currentGenome].holes;
 				rating += algorithm.roughness * genomes[currentGenome].roughness;
				//ako je potez koji gubi igru, dodatno smanjujemo rejting
 				if (moveDownResults.lose) {
 					rating -= 500;
					possibleMoves.push({rotations: rots, translation: t, rating: rating, algorithm: algorithm});
 				} else {
					var lastState1 = getState();
					//svi potezi za sledecu tetrominu
					for (var rots1 = 0; rots1 < 4; rots1++) 
					{
						var oldX1 = [];
						//ovo su iteracije za sva moguce pomjeranja lijevo i desno
						for (var t1 = -5; t1 <= 5; t1++) {
							//iterations++;
							loadState(lastState1);
							//rotiramo
							for (var j1 = 0; j1 < rots1; j1++) {
								rotateShape();
							}
							//pomjera se figura lijevo
							if (t1 < 0) {
								for (var l1 = 0; l1 < Math.abs(t1); l1++) {
									moveLeft();
								}
							//pomjera se figura desno
							} else if (t1 > 0) {
								for (var r1 = 0; r1 < t1; r1++) {
									moveRight();
								}
							}
							//ako se figura uopste pomjerila
							if (!contains(oldX1, currentShape.x)) {
								//pomjeramo je dolje
								var moveDownResults1 = moveDown();
								while (moveDownResults1.moved) {
									moveDownResults1 = moveDown();
								}
								
								//kao posledicu poteza postavljamo sedam vrijednosti genoma
								var algorithm1 = {
									rowsCleared: clone(clearedRows),//moveDownResults.rowsCleared,
									//weightedHeight: Math.pow(getHeight(), 1.5),
									cumulativeHeight: getCumulativeHeight(),
									//relativeHeight: getRelativeHeight(),
									holes: getHoles(),
									roughness: getRoughness()
								};
								//racunamo rejting za taj potez, mnozeci parametre poteza sa parametrima trenutnog genoma
								var rating1 = 0;
								rating1 += algorithm1.rowsCleared * genomes[currentGenome].rowsCleared;
								//rating1 += algorithm1.weightedHeight * genomes[currentGenome].weightedHeight;
								rating1 += algorithm1.cumulativeHeight * genomes[currentGenome].cumulativeHeight;
								//rating1 += algorithm1.relativeHeight * genomes[currentGenome].relativeHeight;
								rating1 += algorithm1.holes * genomes[currentGenome].holes;
								rating1 += algorithm1.roughness * genomes[currentGenome].roughness;
								//ako je potez koji gubi igru, dodatno smanjujemo rejting
								if (moveDownResults1.lose) {
									rating1 -= 500;
								}
								//guramo sve poteze, sa njihovim rejtingom i vrijednostima parametara algoritma u niz
								var currRating = rating + rating1;
								possibleMoves.push({rotations: rots, translation: t, rating: currRating, algorithm: algorithm});
								//cuvamo staru X poziciju figure, da ne bi ponavljali poteze
								oldX1.push(currentShape.x);
							}
						}
					}
				}
				//guramo sve poteze, sa njihovim rejtingom i vrijednostima parametara algoritma u niz
 				//possibleMoves.push({rotations: rots, translation: t, rating: rating, algorithm: algorithm});
 				//cuvamo staru X poziciju figure, da ne bi ponavljali poteze
 				oldX.push(currentShape.x);
 			}
 		}
 	}
 	//vracamo stanje prije isprobavanja svih poteza
 	loadState(lastState);
 	//vraca se niz svih mogucih poteza
 	return possibleMoves;
 }

 //Vraca potez sa najvecim rejtingom iz niza pokreta
 function getHighestRatedMove(moves) {
	var maxRating = -999999999999999;
 	var maxMove = -1;
 	var ties = [];
	//prolazimu kroz niz poteza
 	for (var index = 0; index < moves.length; index++) {
 		//ako je rejting trenutnog poteza veci od maksimalnog, cuvamo ga kao novi maksimalni
 		if (moves[index].rating > maxRating) {
 			maxRating = moves[index].rating;
 			maxMove = index;
 			//cuvamo indeks ovog poteza
 			ties = [index];
 		} else if (moves[index].rating == maxRating) {
 			//ako nadjemo rejting koji je jednak maksimalnom cuvamo mu indeks
 			ties.push(index);
 		}
 	}
 	//na kraju cuvamo potez sa najvecim rejtingom
	var move = moves[ties[0]];
	//i postavljamo broj izjednacenih
	move.algorithm.ties = ties.length;
	return move;
}

 //Funkcija koja pravi potez na osnovu parametara u trenutnom genomu
 function makeNextMove() {
	//povecavamo broj napravljenih poteza
 	movesTaken++;
 	//ako smo prebacili maksimalan broj poteza
 	if (movesTaken > moveLimit) {
		//azuiraramo vrijednost fitnesa za ovaj genom koristeci trenutni rezultat igre
 		genomes[currentGenome].fitness = clone(score);
		if(score > highScore) highScore = score;
		if(movesTaken > mostMoves) mostMoves = movesTaken;
		if(clearedRows > mostClearedRows) mostClearedRows = clearedRows;
		clearedRows = 0;
 		//i prelazimo na sledeci genom
 		evaluateNextGenome();
 	} else {
 		//ovdje pravimo potez

 		//cuvamo stari crtez jer cemo morati ponovo da crtamo
 		var oldDraw = clone(draw);
 		draw = false;
 		//uzimamo sve moguce poteze u trenutnom stanju
 		var possibleMoves = getAllPossibleMoves();
 		//cuvamo trenutno stanje
 		//var lastState = getState();
 		//uzimamo sledecu figuru
 		//nextShape();
 		//sada uzimamo sledeci tetromino koji je igracu uvijek poznat, pa trazimo
		//najbolji potez sa tom figurom i dodajemo taj rejting na rejting poteza iz prethodnog stanja
 		//for (var i = 0; i < possibleMoves.length; i++) {
 		//	var nextMove = getHighestRatedMove(getAllPossibleMoves());
 		//	possibleMoves[i].rating += nextMove.rating;
 		//}
 		//vracamo prethodno stanje
 		//loadState(lastState);
 		//uzimamo potez sa najboljim rejtingom
 		var move = getHighestRatedMove(possibleMoves);
 		//onda rotiramo figuru u skladu sa potezom
 		for (var rotations = 0; rotations < move.rotations; rotations++) {
 			rotateShape();
 		}
 		//pomjeramo je lijevo u skladu sa potezom
 		if (move.translation < 0) {
 			for (var lefts = 0; lefts < Math.abs(move.translation); lefts++) {
 				moveLeft();
 			}
 			//pomjeramo je desno u skladu sa potezom
 		} else if (move.translation > 0) {
 			for (var rights = 0; rights < move.translation; rights++) {
 				moveRight();
 			}
 		}
 		//vracamo pocetni crtez
 		draw = oldDraw;
 		//radimo output na ekran
 		output();
 		//azuriramo rezultat
 		updateScore();
 	}
 }

 //Azuriramo igru
 function update() {
	//ako je AI ukljucen i imamo trenutni genom pravimo potez
 	if (ai && currentGenome != -1) {
 		//pomjeramo figuru dolje
 		var results = moveDown();
 		//ako se nista nije desilo
 		if (!results.moved) {
 			//ako je igra izgubljena
 			if (results.lose) {
 				//azuriramo fitnes genoma
 				genomes[currentGenome].fitness = clone(score);
				if(score > highScore) highScore = score;
				if(movesTaken > mostMoves) mostMoves = movesTaken;
				if(clearedRows > mostClearedRows) mostClearedRows = clearedRows;
				clearedRows = 0;
 				//idemo na sledeci genom
 				evaluateNextGenome();
 			} else {
 				//ako nismo izgubili, pravimo sledeci potez
				clearedRows += results.rowsCleared;
 				makeNextMove();
 			}
 		}
 	} else {
        //inace nastavljamo dolje
 		moveDown();
 	}
 	//azurira se stanje na ekran
 	output();
 	//azurira se i rezultat
 	updateScore();
 }

 //Pomjera figuru dolje ako je moguce, vraca rezultat pomjeranja
 function moveDown() {
 	//niz mogucnosti
 	var result = {lose: false, moved: true, rowsCleared: 0};
 	//uklanjamo figuru jer cemo da crtamo novu
 	removeShape();
 	//pomjeramo je dolje duz y ose
 	currentShape.y++;
 	//ako se sudari sa mrezom
 	if (collides(grid, currentShape)) {
 		//vracamo je y osom
 		currentShape.y--;
 		//lijepimo je na tu poziciju 
 		applyShape();
 		//idemo na sledecu figuru u "korpi"
 		nextShape();
		//ako je doslo do toga cistimo redove i pamtimo broj ociscenih redova
 		result.rowsCleared = clearRows();
		//sada provjeravamo da li se nova figura sudara sa mrezom
 		if (collides(grid, currentShape)) {
 			//resetujemo, izgubljena igra
 			result.lose = true;
 			if (ai) {
 			} else {
 				reset();
 			}
 		}
 		result.moved = false;
 	}
	//kada smo spustili figuru po y osi sada je crtamo na ekran i azuriramo rezultat
 	applyShape();
 	score++;
 	updateScore();
 	output();
 	return result;
 }

 //Pomjeramo figuru lijevo, ako je to moguce
 function moveLeft() {
 	//uklanjamo trenutnu figuru, guramo je lijevo, ako dodje do sudara vracemo je
	removeShape();
 	currentShape.x--;
 	if (collides(grid, currentShape)) {
 		currentShape.x++;
 	}
 	//postavi novi oblik na mrezu
 	applyShape();
 }

 //Pomjeramo figuru desno, ako je to moguce
 function moveRight() {
 	removeShape();
 	currentShape.x++;
 	if (collides(grid, currentShape)) {
 		currentShape.x--;
 	}
 	applyShape();
 }

 //Rotiramo figuru na desno, ako dodje do sudara sa mrezom vracemo je
 function rotateShape() {
 	removeShape();
 	currentShape.shape = rotate(currentShape.shape, 1);
 	if (collides(grid, currentShape)) {
 		currentShape.shape = rotate(currentShape.shape, 3);
 	}
 	applyShape();
 }

 //Ova funkcija uklanja redove koji su potpuno popunjeni
 function clearRows() {
 	//prazni niz za redove koje cemo da uklonimo
	var rowsToClear = [];
 	//za svaki red u mrezi
 	for (var row = 0; row < grid.length; row++) {
 		var containsEmptySpace = false;
 		//za svaku kolonu
 		for (var col = 0; col < grid[row].length; col++) {
 			//ako nadjemo praznu celiju, postavljamo vrijednost na true
 			if (grid[row][col] === 0) {
 				containsEmptySpace = true;
 			}
 		}
 		//ako nijedna od celija u redu nije bila prazna
 		if (!containsEmptySpace) {
			//stavljamo indeks toga reda u niz redova za uklanjanje
 			rowsToClear.push(row);
 		}
 	}
	//ovdje povecavamo rezultat u zavisnosti od broja redova koji se uklanjaju
 	if (rowsToClear.length == 1) {
 		score += 400;
 	} else if (rowsToClear.length == 2) {
 		score += 1000;
 	} else if (rowsToClear.length == 3) {
 		score += 3000;
 	} else if (rowsToClear.length >= 4) {
 		score += 12000;
 	}
 	//cuvamo broj uklonjenih redova
 	var rowsCleared = clone(rowsToClear.length);
 	//uklanjamo redove u mrezi cije smo indekse zapamtili u nizu rowsToClear
 	for (var toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
 		grid.splice(rowsToClear[toClear], 1);
 	}
 	//sada posto smo izbrisali pune redove, moramo vratiti toliko praznih redova
 	while (grid.length < 20) {
 		grid.unshift([0,0,0,0,0,0,0,0,0,0]);
 	}
 	//vracamo red uklonjenih redova
 	return rowsCleared;
 }

 //Zalijepo trenutnu figuru na mrezu
 function applyShape() {
 	//za svaku vrijednost u figuri, postavljamo vrijednosti grida na nenulte vrijednosti figure
 	for (var row = 0; row < currentShape.shape.length; row++) {
 		for (var col = 0; col < currentShape.shape[row].length; col++) {
 			//ako nije nula
 			if (currentShape.shape[row][col] !== 0) {
				grid[currentShape.y + row][currentShape.x + col] = currentShape.shape[row][col];
 			}
 		}
 	}
 }

 //Uklanjamo trenutnu figuru sa mreze, isto kao prethodna funkcija samo obratno
 function removeShape() {
 	for (var row = 0; row < currentShape.shape.length; row++) {
 		for (var col = 0; col < currentShape.shape[row].length; col++) {
 			if (currentShape.shape[row][col] !== 0) {
 				grid[currentShape.y + row][currentShape.x + col] = 0;
 			}
 		}
 	}
 }

 //Funkcija koja uzima sledecu figuru iz "korpe" figura
 function nextShape() {
 	//povecavamo indeks "korpe"
 	bagIndex += 1;
 	//ako "korpa" jos nije generisana ili smo dosli do njenog kraja pravimo novu
 	if (bag.length === 0 || bagIndex == bag.length) {
 		generateBag();
 	}
 	//ako smo na zadnjem elementu "korpe"
 	if (bagIndex == bag.length - 1) {
 		//cuvamo prethodni seed
 		var prevSeed = rndSeed;
 		//generise se nasumicno sledeca figura
 		upcomingShape = randomProperty(shapes);
 		//vracamo prethodni seed
 		rndSeed = prevSeed;
 	} else {
 		//ako nismo na zadnjem elementu "korpe", za sledecu figuru samo postavimo sledecu figuru iz korpe
 		upcomingShape = shapes[bag[bagIndex + 1]];
 	}
 	//uzimamo trenutnu figuru iz "korpe"
 	currentShape.shape = shapes[bag[bagIndex]];
 	//postavljamo figuru na sredinu x ose
 	currentShape.x = Math.floor(grid[0].length / 2) - Math.ceil(currentShape.shape[0].length / 2);
 	currentShape.y = 0;
 }

 //Generisemo "korpu" figura, sto je u stvari nasumicna permutacija sedam mogucih oblika
 function generateBag() {
 	bag = [];
 	var contents = "";
 	//7 oblika
 	for (var i = 0; i < 7; i++) {
 		//uzimamo nasumicni oblik
 		var shape = randomKey(shapes);
 		while(contents.indexOf(shape) != -1) {
 			shape = randomKey(shapes);
 		}
		//stavljamo taj oblik u korpu
 		bag[i] = shape;
 		contents += shape;
 	}
 	//resetujemo indeks korpe
 	bagIndex = 0;
 }

 //Resetujemo igru
 function reset() {
 	score = 0;
	clearedRows = 0;
 	grid = [[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	];
 	moves = 0;
 	generateBag();
 	nextShape();
 }

 //Funkcija odredjuje da li se data mreza i figura sudaraju
 function collides(scene, object) {
 	//prolazimo kroz vrijednosti figure
 	for (var row = 0; row < object.shape.length; row++) {
 		for (var col = 0; col < object.shape[row].length; col++) {
 			if (object.shape[row][col] !== 0) {
 				//ako izadje van granica mreze ili se sudari sa nekom drugom figurom vracemo true
 				if (scene[object.y + row] === undefined || scene[object.y + row][object.x + col] === undefined || scene[object.y + row][object.x + col] !== 0) {
 					return true;
 				}
 			}
 		}
 	}
 	return false;
 }

//Funkcija koja rotira figuru
 function rotate(matrix, times) {
 	//times je koliko puta se rotira
 	for (var t = 0; t < times; t++) {
 		//radimo transponovanje matrice figure
 		matrix = transpose(matrix);
 		//i onda okrenemo svaki red matrice kako bi se dobila tacna rotacija
 		for (var i = 0; i < matrix.length; i++) {
 			matrix[i].reverse();
 		}
 	}
 	return matrix;
 }
//funkcija za transponovanje matrice
 function transpose(array) {
 	return array[0].map(function(col, i) {
 		return array.map(function(row) {
 			return row[i];
 		});
 	});
 }


 //Crtamo trenutno stanje na ekran
 function output() {
 	if (draw) {
 		var output = document.getElementById("output");
 		var html = "<h1>Tetris</h1> <canvas id=\"myCanvas\" width=\"301\" height=\"601\"></canvas>";
 		output.innerHTML = html;
		html = "";
		var canvas = document.getElementById("myCanvas");
		var context = canvas.getContext("2d");
		var w = 300, h = 600, p = 0;
		function drawGrid() {
			
			for(var x=0; x <= w; x += 30) {
				context.moveTo(0.5 + x + p, p);
				context.lineTo(0.5 + x + p, h + p);
			}
			
			for(var x = 0; x <= h; x += 30) {
				context.moveTo(p, 0.5 + x + p);
				context.lineTo(w + p, 0.5 + x + p);
			}
			
			context.strokeStyle = "#ecc41c";
			context.stroke();
		}
		drawGrid();
		
 		for (var i = 0; i < grid.length; i++) {
			for (var j = 0; j<grid[i].length; j++) {
				if( grid[i][j] === 1)
				{
					context.fillStyle = colors[0];
					context.fillRect(j*30,i*30,30,30);
				}else if(grid[i][j] === 2)
				{
					context.fillStyle = colors[1];
					context.fillRect(j*30,i*30,30,30);
				}else if(grid[i][j] === 3)
				{
					context.fillStyle = colors[2];
					context.fillRect(j*30,i*30,30,30);
				}else if(grid[i][j] === 4)
				{
					context.fillStyle = colors[3];
					context.fillRect(j*30,i*30,30,30);
				}else if(grid[i][j] === 5)
				{
					context.fillStyle = colors[4];
					context.fillRect(j*30,i*30,30,30);
				}else if(grid[i][j] === 6)
				{
					context.fillStyle = colors[5];
					context.fillRect(j*30,i*30,30,30);
				}else if(grid[i][j] === 7)
				{
					context.fillStyle = colors[6];
					context.fillRect(j*30,i*30,30,30);
				}
			}
 		}
 	}
 }

 //Azuriramo podatke sa strane, rezultat, generaciju, ...
 function updateScore() {
 	if (draw) {
 		var scoreDetails = document.getElementById("score");
 		var html = "<br /><br /><h2>&nbsp;</h2><h2>Rezultat: " + score + "</h2>";
 		html += "<b>Najbolji rezultat: " + highScore + "</b>";
		html += "<br /><br /><b>Sledeca figura: </b>";
 		html += "<br />";
		html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;<canvas id=\"myCanvas1\" width=\"120\" height=\"120\"></canvas>";
 		html += "<br />Brzina: " + speed;
 		if (ai) {
 			html += "<br />Broj poteza: " + movesTaken + "/" + moveLimit;
			html += "<br />Najvise poteza do sada: " + mostMoves;
			html += "<br />Broj ociscenih redova do sada: " + clearedRows;
			html += "<br />Najvise ociscenih redova do ove igre: " + mostClearedRows;
 			html += "<br />Generacija: " + generation;
 			html += "<br />Jedinka: " + (currentGenome + 1)  + "/" + populationSize;
 			html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
 		}
 		scoreDetails.innerHTML = html;
		var canvas = document.getElementById("myCanvas1");
		var context = canvas.getContext("2d");
		var w = 120, h = 120, p = 0;
		for (var i = 0; i < upcomingShape.length; i++) {
 			for (var j = 0; j < upcomingShape[i].length; j++) {
				if( upcomingShape[i][j] === 1)
				{
					context.fillStyle = colors[0];
					context.fillRect(j*30,i*30,30,30);
				}else if(upcomingShape[i][j] === 2)
				{
					context.fillStyle = colors[1];
					context.fillRect(j*30,i*30,30,30);
				}else if(upcomingShape[i][j] === 3)
				{
					context.fillStyle = colors[2];
					context.fillRect(j*30,i*30,30,30);
				}else if(upcomingShape[i][j] === 4)
				{
					context.fillStyle = colors[3];
					context.fillRect(j*30,i*30,30,30);
				}else if(upcomingShape[i][j] === 5)
				{
					context.fillStyle = colors[4];
					context.fillRect(j*30,i*30,30,30);
				}else if(upcomingShape[i][j] === 6)
				{
					context.fillStyle = colors[5];
					context.fillRect(j*30,i*30,30,30);
				}else if(upcomingShape[i][j] === 7)
				{
					context.fillStyle = colors[6];
					context.fillRect(j*30,i*30,30,30);
				}
			}
 		}
 	}
 }

 //Vracamo trenutno stanje igre
 function getState() {
 	var state = {
 		grid: clone(grid),
 		currentShape: clone(currentShape),
 		upcomingShape: clone(upcomingShape),
 		bag: clone(bag),
 		bagIndex: clone(bagIndex),
 		rndSeed: clone(rndSeed),
 		score: clone(score)
 	};
 	return state;
 }

 //Ucitavamo dato stanje u trenutno stanje igre
 function loadState(state) {
 	grid = clone(state.grid);
 	currentShape = clone(state.currentShape);
 	upcomingShape = clone(state.upcomingShape);
 	bag = clone(state.bag);
 	bagIndex = clone(state.bagIndex);
 	rndSeed = clone(state.rndSeed);
 	score = clone(state.score);
 	output();
 	updateScore();
 }

 //Vraca ukupnu visinu svih kolona
 function getCumulativeHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var totalHeight = 0;
 	for (var i = 0; i < peaks.length; i++) {
 		totalHeight += 20 - peaks[i];
 	}
 	applyShape();
 	return totalHeight;
 }

 //Vraca broj nepopunjivih rupa u mrezi
 function getHoles() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var holes = 0;
 	for (var x = 0; x < peaks.length; x++) {
 		for (var y = peaks[x]; y < grid.length; y++) {
 			if (grid[y][x] === 0) {
 				holes++;
 			}
 		}
 	}
 	applyShape();
 	return holes;
 }

 //Vraca niz koji mijenja sve rupe u mrezi sa -1
 function getHolesArray() {
 	var array = clone(grid);
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	for (var x = 0; x < peaks.length; x++) {
 		for (var y = peaks[x]; y < grid.length; y++) {
 			if (grid[y][x] === 0) {
 				array[y][x] = -1;
 			}
 		}
 	}
 	applyShape();
 	return array;
 }

 //Racunamo "grubost" mreze
 function getRoughness() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var roughness = 0;
 	var differences = [];
 	for (var i = 0; i < peaks.length - 1; i++) {
 		roughness += Math.abs(peaks[i] - peaks[i + 1]);
 		differences[i] = Math.abs(peaks[i] - peaks[i + 1]);
 	}
 	applyShape();
 	return roughness;
 }
/*
 //Vraca domet visina kolona mreze, razlika najvise i najnize
 function getRelativeHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	applyShape();
 	return Math.max.apply(Math, peaks) - Math.min.apply(Math, peaks);
 }
*/
/*
 //Visina najvece kolone na mrezi
 function getHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	applyShape();
 	return 20 - Math.min.apply(Math, peaks);
 }
*/
 //Ucitavanje date arhive
 function loadArchive(archiveString) {
 	archive = JSON.parse(archiveString);
 	genomes = clone(archive.genomes);
 	populationSize = archive.populationSize;
 	generation = archive.currentGeneration;
 	currentGenome = 0;
 	reset();
 	roundState = getState();
 	console.log("Archive loaded!");
 }

 //Kopiranje objekta
 function clone(obj) {
 	return JSON.parse(JSON.stringify(obj));
 }

 //Vraca nasumicni elemenat datog objekta
 function randomProperty(obj) {
 	return(obj[randomKey(obj)]);
 }

 //Vraca nasumicni kljuc (indeks) za dati objekat
 function randomKey(obj) {
 	var keys = Object.keys(obj);
 	var i = seededRandom(0, keys.length);
 	return keys[i];
 }

 function replaceAll(target, search, replacement) {
 	return target.replace(new RegExp(search, 'g'), replacement);
 }

 //Funkcija za nasumicni broj, koji se odredjuje na osnovu seed-a
 function seededRandom(min, max) {
 	max = max || 1;
 	min = min || 0;

 	rndSeed = (rndSeed * 9301 + 49297) % 233280;
 	var rnd = rndSeed / 233280;

 	return Math.floor(min + rnd * (max - min));
 }

 function randomNumBetween(min, max) {
 	return Math.floor(Math.random() * (max - min + 1) + min);
 }

 function randomWeightedNumBetween(min, max) {
 	return Math.floor(Math.pow(Math.random(), 2) * (max - min + 1) + min);
 }

 function randomChoice(propOne, propTwo) {
 	if (Math.round(Math.random()) === 0) {
 		return clone(propOne);
 	} else {
 		return clone(propTwo);
 	}
 }

 function contains(a, obj) {
 	var i = a.length;
 	while (i--) {
 		if (a[i] === obj) {
 			return true;
 		}
 	}
 	return false;
 }
