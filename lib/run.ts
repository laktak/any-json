#!/usr/bin/env node

import * as dashdash from "dashdash";
import * as fs from "fs";
import * as anyjson from "./";
import * as path from "path";
import * as util from "util";
require('util.promisify/shim')();

const version = require("../../package.json").version;

function removeLeadingDot(formatOrExtension: string) {
    if (formatOrExtension && formatOrExtension[0] === ".") return formatOrExtension.substr(1);
    else return formatOrExtension;
}

function getEncoding(format: string) {
    switch (format) {
        case "xlsx": return "binary";
        case "xls": return "binary";
        default: return "utf8";
    }
}

const convertConfiguration: dashdash.ParserConfiguration =
    {
        options: [
            {
                names: ["help", 'h'],
                type: "bool",
                help: "Prints this help and exits."
            },
            {
                name: "version",
                type: "bool",
                help: "Prints version information and exits."
            },
            {group: "convert options"},
            {
                name: "input-format",
                type: "string",
                help: "Specifies the format of the input (assumed by file extension when not provided).",
                helpArg: "FORMAT"
            },
            {
                name: "output-format",
                type: "string",
                help: "Specifies the format of the output (default: json).",
                helpArg: "json",
                default: "json"
            }
        ]
    };

export async function main(argv: string[]) {

    const commands = ['convert'];

    const commandSpecified = commands.indexOf(argv[2]) >= 0;
    const command = commandSpecified ? argv[2] : "convert";

    const convertParser = dashdash.createParser(convertConfiguration);

    function getHelpMessage() {
        const help = convertParser.help();
        return `usage: any-json [command] FILE [options]

any-json can be used to convert (almost) anything to JSON.

This version supports:
    cson, csv, hjson, ini, json, json5, yaml

command:
    convert (default when none specified)

options:
${help}`
    }

    const options = function () {
        try {
            return convertParser.parse({ argv, slice: commandSpecified ? 3 : 2 });
        }
        catch (err) {
            throw err;
        }
    }();

    if (options.version) {
        return `any-json version ${version}`;
    }

    if (options.help || argv.length <= 2) {
        return getHelpMessage();
    }

    if (options._args.length > 1) {
        throw "too many arguments";
    }

    const fileName = options._args[0] as string;
    const format = options.input_format || removeLeadingDot(path.extname(fileName)).toLowerCase();

    // TODO: Will need to check for binary files (see `getEncoding`)
    const fileContents = await util.promisify(fs.readFile)(fileName, "utf8")
    const parsed = await anyjson.decode(fileContents, format)
    return await anyjson.encode(parsed, options.output_format);
}

if (require.main === module) {
    main(process.argv)
        .then(s => console.log(s))
        .catch(error => {
            console.error(error);
            process.exit(2);
        });
}