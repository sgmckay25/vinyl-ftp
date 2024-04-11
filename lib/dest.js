module.exports = dest;


const crypto = require('crypto');
const fsg = require('fs');

// Cache pour stocker les hashes des fichiers
const fileHashCache = {};

function dest(folder, options) {
	options = this.makeOptions(options);
	var self = this;

	var stream = this.parallel(function (file, cb) {
		// Ignorer si ce n'est pas un fichier
		if (!file.stat.isFile()) {
			console.log('Ignoré (n\'est pas un fichier):', file.path);
			cb();
			return;
		}

		// Calculer le hash MD5 du fichier
		createMD5(file.path)
			.then(hash => {
				if (fileHashCache[file.path] === hash) {
					console.log('Fichier déjà transféré, cache hit:', file.path);
					cb();
					return;
				}

				// Mise à jour du cache avec le nouveau hash
				fileHashCache[file.path] = hash;
				var path = self.join('/', folder, file.relative);
				console.log('Transfert du fichier:', file.path);
				self.upload(file, path, cb);
			})
			.catch(err => {
				console.error('Erreur lors de la création du hash MD5:', err);
				console.error('Chemin du fichier:', file.path);
				cb(err);
			});
	}, options);

	stream.resume();
	return stream;
}


function createMD5(filePath) {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash('md5');
		const rStream = fsg.createReadStream(filePath);
		rStream.on('data', (data) => {
			hash.update(data);
		});
		rStream.on('end', () => {
			resolve(hash.digest('hex'));
		});
		rStream.on('error', (err) => {
			reject(err);
		});
	});
}
