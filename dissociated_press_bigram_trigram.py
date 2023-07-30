"""
Dissociated Press (Markov model) using bigrams or trigrams.

David S. Touretzky, Carnegie Mellon University
July 2023

"""

import numpy

def get_words(text_string):
    "Convert the text to a list of lowercase words with most punctuation removed"
    remove_chars = ',:;()"\n'
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
    if bigram_dict is None:
        bigram_dict = global_bigram_dict
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
    if trigram_dict is None:
        trigram_dict = global_trigram_dict
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

dachs = """
A Transformer is a deep learning architecture that relies on the attention mechanism.[1] 
It is notable for requiring less training time compared to previous recurrent neural architectures, such as long short-term memory (LSTM),[2] 
and has been prevalently adopted for training large language models on large (language) datasets, such as the Wikipedia Corpus and Common Crawl,
by virtue of the parallelized processing of input sequence.[3] More specifically, the model takes in tokenized (byte pair encoding) input tokens,
and at each layer, contextualizes each token with other (unmasked) input tokens in parallel via attention mechanism. Though the Transformer model 
came out in 2017, the core attention mechanism was proposed earlier in 2014 by Bahdanau, Cho, and Bengio for machine translation.[4][5] This 
architecture is now used not only in natural language processing, computer vision,[6] but also in audio,[7] and multi-modal processing. It has 
also led to the development of pre-trained systems, such as generative pre-trained transformers (GPTs)[8] and BERT[9] (Bidirectional Encoder 
Representations from Transformers).

Before transformers, most state-of-the-art NLP systems relied on gated RNNs, such as LSTMs and gated recurrent units (GRUs), with various 
attention mechanisms added to them. Unlike RNNs, transformers do not have a recurrent structure. Provided with enough training data, their 
attention mechanisms alone can match the performance of RNNs with attention added.[1]

In 1992, Jürgen Schmidhuber published the fast weight controller as an alternative to RNNs that can learn "internal spotlights of attention,"[10]
 and experimented with using it to learn variable binding.[11]

In a fast weight controller, a feedforward neural network ("slow") learns by gradient descent to control the weights of another neural network 
("fast") through outer products of self-generated activation patterns called "FROM" and "TO" which corresponds to "key" and "value" in the 
attention mechanism.[12] This fast weight is applied to queries. The attention mechanism may be obtained by interposing a softmax operator and three 
linear operators (one for each of query, key, and value).[12][13]

In 1992, Jürgen Schmidhuber published the fast weight controller as an alternative to RNNs that can learn "internal spotlights of attention,"[10] and 
experimented with using it to learn variable binding.[11]

In a fast weight controller, a feedforward neural network ("slow") learns by gradient descent to control the weights of another neural network ("fast") 
through outer products of self-generated activation patterns called "FROM" and "TO" which corresponds to "key" and "value" in the attention mechanism.[12] 
This fast weight is applied to queries. The attention mechanism may be obtained by interposing a softmax operator and three linear operators (one for each of 
query, key, and value).[12][13]

"""

global_bigram_dict  = make_bigram_dict(dachs)
global_trigram_dict = make_trigram_dict(dachs)

if __name__ == '__main__':
    print(f"Bigram dictionary has {len(global_bigram_dict)} entries, " +
          f"branching factor {branching_factor(global_bigram_dict):5.3f}.")
    print(f"Trigram dictionary has {len(global_trigram_dict)} entries, " +
          f"branching factor {branching_factor(global_trigram_dict):5.3f}.", end = "\n\n")
    print(gen_trigram())
    print("Global Bigram Dictionary:\n", global_bigram_dict)
    print("Global Trigram Dictionary:\n", global_trigram_dict)