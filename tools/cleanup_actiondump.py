import json
import gzip
from typing import Literal
import time
import os

with open("raw_actiondump.json", encoding="utf-8") as f:
    actiondump = json.loads(f.read())

def parse_additional_information(raw: list[list[str]]) -> list[str]:
    return ["\n".join(info) for info in raw]


def parse_examples(raw: list[str]) -> list[str]:
    examples = []
    for example in raw:
        if example.startswith("» ") or example.startswith("⏵ "):
            examples.append(example[2:])
        else:
            examples[-1] += "\n" + example
    return examples


def parse_codeblocks(codeblocks: list[dict]) -> tuple[dict, dict[str, str]]:
    parsed = {}
    name_reverse_map = {}
    for codeblock in codeblocks:
        parsed[codeblock["identifier"]] = {
            "description": "\n".join(codeblock["item"]["description"]),
            "examples": parse_examples(codeblock["item"]["example"]),
            "additional_information": parse_additional_information(codeblock["item"]["additionalInfo"])
        }
        name_reverse_map[codeblock["name"]] = codeblock["identifier"]

    return parsed, name_reverse_map


def check_deprecation(action: str, action_name: str, actions: list[dict]) -> str | None | Literal[True]:
    undeprecated = " " + action + " "
    deprecated = (not action_name) or any(act["name"] == undeprecated for act in actions)
    if deprecated:
        if not action_name:
            return True
        if new_undeprecated := check_deprecation(undeprecated, action_name, actions):
            return new_undeprecated
        return undeprecated
    return None


def parse_block_tag_options(options: list[dict]) -> dict:
    parsed = {}
    for option in options:
        parsed[option["name"]] = {
            "material": option["icon"]["material"].lower(),
            "description": "\n".join(option["icon"]["description"])
        }

    return parsed


def parse_block_tags(block_tags: list[dict]) -> list[dict]:
    parsed = []
    for block_tag in block_tags:
        parsed.append({
            "name": block_tag["name"],
            "options": parse_block_tag_options(block_tag["options"]),
            "default": block_tag["defaultOption"],
            "slot": block_tag["slot"]
        })

    return parsed


TYPE_ID_MAP = {
    "NUMBER": "num",
    "VECTOR": "vec",
    "TEXT": "txt",
    "COMPONENT": "comp",
    "VARIABLE": "var",
    "ANY_TYPE": "any",
    "ITEM": "item",
    "LOCATION": "loc",
    "LIST": "list",
    "SOUND": "snd",
    "PARTICLE": "part",
    "POTION": "pot",
    "BLOCK": "block",
    # special handling
    "DICT": "dict",
    "BLOCK_TAG": "block_state_tag",
    "PROJECTILE": "projectile",
    "SPAWN_EGG": "spawn_egg",
    "ENTITY_TYPE": "entity_type",
    "VEHICLE": "vehicle",
    "NONE": "none",
    "BYTE": "byte",
    "RANDOM_GENERATOR": "random_generator" # new data type on node Beta. Formed using set_var.RandomGenerator
}


def parse_arguments(args_list: list[dict]) -> list[dict]:
    parsed = []
    for arg in args_list:
        if "text" in arg:
            if arg["text"] == "OR":
                parsed.append({
                    "$alternative": None
                })
            elif arg["text"] == "":
                parsed.append({
                    "$separator": None
                })
        else:
            parsed.append({
                "type": TYPE_ID_MAP[arg["type"]],
                "plural": arg["plural"],
                "optional": arg["optional"],
                "description": "\n".join(arg["description"]),
                "notes": parse_additional_information(arg["notes"])
            })

    return parsed


def parse_returns(returns: list[dict]) -> list[dict]:
    parsed = []
    for ret in returns:
        if "text" in ret:
            parsed.append({
                "$alternative": None
            })
        else:
            parsed.append({
                "type": TYPE_ID_MAP[ret["type"]],
                "description": "\n".join(ret["description"])
            })

    return parsed


def parse_actions(actions: list[dict], codeblock_name_reverse_map: dict[str, str]) -> tuple[dict, dict]:
    parsed = {}
    category_reverse_map = {}
    for action in actions:
        identifier = codeblock_name_reverse_map[action["codeblockName"]]
        if identifier not in parsed:
            parsed[identifier] = {}
        parsed[identifier][action["name"]] = {
            "material": action["icon"]["material"].lower(),
            "name": action["icon"]["name"] or action["name"],
            "aliases": action["aliases"] if "aliases" in action else [],
            "deprecated": check_deprecation(action["name"], action["icon"]["name"], actions),
            "requires": {
                "tokens": action["icon"]["requireTokens"],
                "rank": action["icon"]["requiredRank"] or None,
                "world_plot": action["icon"]["worldExclusive"] or False
            },
            "advanced": action["icon"]["advanced"],
            "works_with": action["icon"]["worksWith"],
            "block_tags": parse_block_tags(action["tags"]),
            "arguments": parse_arguments(action["icon"]["arguments"] if "arguments" in action["icon"] else []),
            "returns": parse_returns(action["icon"]["returnValues"] if "returnValues" in action["icon"] else []),
            "additional_information": parse_additional_information(action["icon"]["additionalInfo"]),
            "description": "\n".join(action["icon"]["description"]),
            "subactions": action["subActionBlocks"] if "subActionBlocks" in action else []
        }
        if identifier.endswith("event"):
            parsed[identifier][action["name"]]["cancellable"] = ("auto" if action["icon"]["cancelledAutomatically"] else action["icon"]["cancellable"]) if "cancellable" in action["icon"] else False

        category_reverse_map[action["name"]] = identifier

    return parsed, category_reverse_map


def parse_gv_categories(categories: list[dict]) -> tuple[dict, dict]:
    parsed = {}
    particles = {}
    for category in categories:
        pointer = parsed
        if category["identifier"].endswith("Particles"): # for some reason, particles are part of `gameValueCategories`
            pointer = particles

        pointer[category["identifier"]] = {
            "material": category["icon"]["material"].lower(),
            "description": "\n".join(category["icon"]["description"])
        }

    return parsed, particles


def parse_gvs(values: list[dict]) -> tuple[dict, dict[str, str]]:
    parsed = {}
    reverse_map = {}
    for value in values:
        if value["category"] not in parsed:
            parsed[value["category"]] = {}

        parsed[value["category"]][value["icon"]["name"]] = {
            "material": value["icon"]["material"].lower(),
            "description": "\n".join(value["icon"]["description"]),
            "additional_information": parse_additional_information(value["icon"]["additionalInfo"]),
            "requires": {
                "tokens": value["icon"]["requireTokens"],
                "rank": value["icon"]["requiredRank"] or None
            },
            "works_with": value["icon"]["worksWith"],
            "examples": parse_examples(value["icon"]["example"]),
            "returns": {
                "type": TYPE_ID_MAP[value["icon"]["returnType"]],
                "description": "\n".join(value["icon"]["returnDescription"])
            }
        }

        reverse_map[value["icon"]["name"]] = value["category"]

    return parsed, reverse_map


def parse_particles(particles: list[dict]) -> tuple[dict, dict[str, str]]:
    parsed = {}
    reverse_map = {}
    for particle in particles:
        if particle["category"] not in parsed:
            parsed[particle["category"]] = {}

        parsed[particle["category"]][particle["icon"]["name"]] = {
            "material": particle["icon"]["material"].lower(),
            "additional_information": parse_additional_information(particle["icon"]["additionalInfo"]),
            "fields": particle["fields"]
        }
        reverse_map[particle["icon"]["name"]] = particle["category"]

    return parsed, reverse_map


def parse_sound_categories(categories: list[dict]) -> dict:
    parsed = {}
    for category in categories:
        parsed[category["identifier"]] = {
            "material": category["icon"]["material"].lower(),
            "name": category["icon"]["name"],
            "description": "\n".join(category["icon"]["description"]),

        }

    return parsed


def parse_sounds(sounds: list[dict]) -> dict:
    parsed = {}
    for sound in sounds:
        parsed[sound["icon"]["name"]] = {
            "material": sound["icon"]["material"].lower(),
            "variants": [variant["id"] for variant in sound["variants"]] if "variants" in sound else []
        }

    return parsed


def parse_potions(potions: list[dict]) -> dict:
    parsed = {}
    for potion in potions:
        parsed[potion["icon"]["name"]] = {
            "material": potion["icon"]["material"].lower(),
            "description": "\n".join(potion["icon"]["description"])
        }

    return parsed


codeblocks, codeblock_name_reverse_map = parse_codeblocks(actiondump["codeblocks"])
actions, action_category_reverse_map = parse_actions(actiondump["actions"], codeblock_name_reverse_map)
gv_categories, particle_categories = parse_gv_categories(actiondump["gameValueCategories"])
gvs, gv_category_reverse_map = parse_gvs(actiondump["gameValues"])
particles, particle_category_reverse_map = parse_particles(actiondump["particles"])
sound_categories = parse_sound_categories(actiondump["soundCategories"])
sounds = parse_sounds(actiondump["sounds"])
potions = parse_potions(actiondump["potions"])

table = {
    "codeblocks": codeblocks,
    "actions": actions,
    "actions_category_reverse_map": action_category_reverse_map,
    "gv_categories": gv_categories,
    "particle_categories": particle_categories,
    "gvs": gvs,
    "gv_category_reverse_map": gv_category_reverse_map,
    "particles": particles,
    "particle_category_reverse_map": particle_category_reverse_map,
    "sound_categories": sound_categories,
    "sounds": sounds,
    "potions": potions
}

data = {}
if os.path.exists("../src/lib/misc/actiondump.json"):
    with open("../src/lib/misc/actiondump.json") as f:
        data = json.loads(f.read())
        if "time" in data:
            del data["time"]

if data != table:
    with open("../src/lib/misc/actiondump.json", "w+") as f:
        table["time"] = time.time()
        json.dump(table, f, indent=4)
