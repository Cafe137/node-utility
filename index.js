const cafe_utility_1 = require('cafe-utility')
const child_process_1 = require('child_process')
const crypto_1 = require('crypto')
const fs_1 = require('fs')
const promises_1 = require('fs/promises')
const path_1 = require('path')

async function mkdirp(path) {
    const segments = path.split('/')
    let buffer = ''
    for (const segment of segments) {
        buffer += segment + '/'
        if (!(await existsAsync(buffer))) {
            try {
                await (0, promises_1.mkdir)(buffer)
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error
                }
            }
        }
    }
}

async function writeUtf8FileAsync(path, content) {
    await (0, promises_1.writeFile)(path, content, 'utf8')
}

async function putFile(path, content) {
    const [directory] = cafe_utility_1.Strings.splitOnce(path, '/', true)
    if (directory) {
        await mkdirp(directory)
    }
    await writeUtf8FileAsync(path, content)
}

async function readUtf8FileAsync(path) {
    return (0, promises_1.readFile)(path, 'utf8')
}

async function readJsonAsync(path) {
    return JSON.parse(await readUtf8FileAsync(path))
}

async function writeJsonAsync(path, object, prettify) {
    if (prettify) {
        await (0, promises_1.writeFile)(path, JSON.stringify(object, null, 4))
    } else {
        await (0, promises_1.writeFile)(path, JSON.stringify(object))
    }
}

async function readLinesAsync(path) {
    return (await readUtf8FileAsync(path)).split(/\r?\n/)
}

async function readMatchingLines(path, filterFn) {
    return (await readLinesAsync(path)).filter(filterFn)
}

async function readNonEmptyLines(path) {
    return readMatchingLines(path, x => !!x)
}

async function readCsv(path, skip = 0, delimiter = ',', quote = '"') {
    return (skip ? (await readNonEmptyLines(path)).slice(skip) : await readNonEmptyLines(path)).map(x =>
        cafe_utility_1.Strings.parseCsv(x, delimiter, quote)
    )
}

async function* walkTreeAsync(path) {
    for await (const directory of await (0, promises_1.opendir)(path)) {
        const entry = (0, path_1.join)(path, directory.name)
        if (directory.isDirectory()) {
            yield* await walkTreeAsync(entry)
        } else if (directory.isFile()) {
            yield entry
        }
    }
}

function removeLeadingDirectory(path, directory) {
    directory = directory.startsWith('./') ? directory.slice(2) : directory
    directory = directory.endsWith('/') ? directory : directory + '/'
    return path.replace(directory, '')
}

async function readdirDeepAsync(path, cwd) {
    const entries = []
    for await (const entry of walkTreeAsync(path)) {
        entries.push(cwd ? removeLeadingDirectory(entry, cwd) : entry)
    }
    return entries
}

async function existsAsync(path) {
    try {
        await (0, promises_1.stat)(path)
        return true
    } catch (error) {
        return false
    }
}

async function getFileSize(path) {
    const stats = await (0, promises_1.stat)(path)
    return stats.size
}

async function getDirectorySize(path) {
    let size = 0
    for await (const file of walkTreeAsync(path)) {
        size += await getFileSize(file)
    }
    return size
}

function getChecksum(data) {
    const hash = (0, crypto_1.createHash)('sha1')
    hash.update(data)
    return hash.digest('hex')
}

async function getChecksumOfFile(path) {
    return new Promise((resolve, reject) => {
        const hash = (0, crypto_1.createHash)('sha1')
        const readStream = (0, fs_1.createReadStream)(path)
        readStream.on('error', reject)
        readStream.on('data', chunk => hash.update(chunk))
        readStream.on('end', () => resolve(hash.digest('hex')))
    })
}

function represent(value) {
    if (cafe_utility_1.Types.isObject(value)) {
        return JSON.stringify(value, null, 4)
    }
    if (value === null) {
        return 'null'
    }
    if (cafe_utility_1.Types.isUndefined(value)) {
        return 'undefined'
    }
    return value
}

const loggerGlobalState = {
    fileStream: null
}

function log(level, module, pieces) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const message = `${timestamp} ${level} ${module} ${pieces.map(represent).join(' ')}\n`
    process.stdout.write(message)
    if (level === 'ERROR') {
        process.stderr.write(message)
    }
    if (loggerGlobalState.fileStream) {
        loggerGlobalState.fileStream.write(message)
    }
}

function createLogger(module) {
    module = cafe_utility_1.Arrays.last(module.split(/\\|\//))
    return {
        trace: (...pieces) => {
            log('TRACE', module, pieces)
        },
        info: (...pieces) => {
            log('INFO', module, pieces)
        },
        warn: (...pieces) => {
            log('WARN', module, pieces)
        },
        error: (...pieces) => {
            log('ERROR', module, pieces)
        },
        errorObject: (error, stackTrace) => {
            log('ERROR', module, [cafe_utility_1.System.expandError(error, stackTrace)])
        }
    }
}

function enableFileLogging(path) {
    loggerGlobalState.fileStream = (0, fs_1.createWriteStream)(path, { flags: 'a' })
}

async function execAsync(command, resolveWithErrors, inherit, options) {
    return new Promise((resolve, reject) => {
        const childProcess = (0, child_process_1.exec)(command, options, (error, stdout, stderr) => {
            if (error) {
                if (resolveWithErrors) {
                    resolve({ error, stdout, stderr })
                } else {
                    reject({ error, stdout, stderr })
                }
            } else {
                resolve({ stdout, stderr })
            }
        })
        if (inherit) {
            childProcess.stdout && childProcess.stdout.pipe(process.stdout)
            childProcess.stderr && childProcess.stderr.pipe(process.stderr)
        }
    })
}

async function runProcess(command, args, options, onStdout, onStderr) {
    return new Promise((resolve, reject) => {
        const subprocess = (0, child_process_1.spawn)(command, args || [], options || {})
        subprocess?.stdout?.on(
            'data',
            onStdout ||
                (data => {
                    process.stdout.write(data.toString())
                })
        )
        subprocess?.stderr?.on(
            'data',
            onStderr ||
                (data => {
                    process.stdout.write(data.toString())
                })
        )
        subprocess.on('close', code => {
            if (code === 0) {
                resolve(code)
            } else {
                reject(code)
            }
        })
        subprocess.on('error', error => {
            if (error.name === 'AbortError') {
                resolve(0)
            } else {
                reject(1)
            }
        })
    })
}

function getHeapMegabytes() {
    const memory = process.memoryUsage()
    return {
        used: (memory.heapUsed / 1024 / 1024).toFixed(3),
        total: (memory.heapTotal / 1024 / 1024).toFixed(3),
        rss: (memory.rss / 1024 / 1024).toFixed(3)
    }
}

exports.Exec = {
    execAsync,
    getHeapMegabytes,
    runProcess
}

exports.Files = {
    existsAsync,
    writeJsonAsync,
    writeUtf8FileAsync,
    putFile,
    readdirDeepAsync,
    readUtf8FileAsync,
    readJsonAsync,
    readLinesAsync,
    readMatchingLines,
    readNonEmptyLines,
    readCsv,
    walkTreeAsync,
    getFileSize,
    getDirectorySize,
    getChecksum,
    getChecksumOfFile,
    mkdirp
}

exports.Logger = {
    create: createLogger,
    enableFileLogging
}
