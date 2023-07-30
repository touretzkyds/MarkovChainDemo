"""
Dissociated Press (Markov model) using bigrams or trigrams.

David S. Touretzky, Carnegie Mellon University
July 2023

"""
import numpy

def get_words(text_string):
    "Convert the text to a list of lowercase words with most punctuation removed"
    remove_chars = ',:;()"\n\t'
    spacer_chars = '.?!'
    result_chars = []
    for char in text_string:
        if char in remove_chars:
            result_chars.append(' ')
        elif char in spacer_chars:
            result_chars.extend([' ', char, ' '])
        else:
            result_chars.append(char.lower())
    result_string = ''.join(result_chars).strip()
    while '  ' in result_string:
        result_string = result_string.replace('  ',' ')
    words = result_string.split(' ')
    return words

def make_bigram_dict(text_string):
    words = get_words(text_string)
    print("WORDS:", words)
    bigram_dict = dict()
    for i in range(len(words)-1):
        key = words[i]
        value = words[i+1]
        if key not in bigram_dict:
            bigram_dict[key] = []
        if value not in bigram_dict[key]:
            bigram_dict[key].append(value)
    return bigram_dict

def make_trigram_dict(text_string):
    words = get_words(text_string)
    trigram_dict = dict()
    for i in range(len(words)-2):
        key = words[i] + ' ' + words[i+1]
        value = words[i+2]
        if key not in trigram_dict:
            trigram_dict[key] = []
        if value not in trigram_dict[key]:
            trigram_dict[key].append(value)
    return trigram_dict

def branching_factor(dict):
    s = sum([len(v) for v in dict.values()])
    return s / len(dict)

def gen_bigram(start=None, bigram_dict=None):
    if start is None:
        keys = list(bigram_dict.keys())
        start = numpy.random.choice(keys)
    elif start not in bigram_dict:
        raise ValueError(f"'{start}' not in bigram dictionary")
    word = start
    sentence = ''
    count = 0
    while word is not None and count < 100:
        sentence += ' ' + word
        count += 1
        if word in bigram_dict:
            word = numpy.random.choice(bigram_dict[word])
        else:
            word = None
    return sentence.strip()

def gen_trigram(start=None, trigram_dict=None):
    if start is None:
        keys = list(trigram_dict.keys())
        start = numpy.random.choice(keys)
    elif start not in trigram_dict:
        raise ValueError(f"'{start}' not in trigram dictionary")
    sentence = ''
    word1, word2 = start.split(' ')
    count = 0
    while word1 is not None and count < 100:
        sentence += ' ' + word1
        count += 1
        key = word1 + ' ' + word2
        if key in trigram_dict:
            word1, word2 = word2, numpy.random.choice(trigram_dict[key])
        else:
            word1, word2 = None, None
    return sentence.strip()
