import random
import json
import pickle
import numpy as np
import nltk
from nltk.stem import WordNetLemmatizer
from tensorflow.keras.models import load_model

lemmatizer = WordNetLemmatizer()

words = pickle.load(open('output/words.pk1', 'rb'))
topics = pickle.load(open('output/topics.pk1', 'rb'))
model = load_model('output/SlackBotNLP.h5')

THRESHOLD = .8
DELIMITER = '§'

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word) for word in sentence_words]
    return sentence_words


def bag_of_words(sentence):
    sentence_words = clean_up_sentence(sentence)
    bag = [0] * len(words)
    for w in sentence_words:
        for i, word in enumerate(words):
            if word == w:
                bag[i] = 1
    return np.array(bag)

def predict_topic(sentence):
    bow = bag_of_words(sentence)
    result = model.predict(np.array([bow]))[0]
    results = [[i, r] for i, r in enumerate(result) if r > THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({'intent':topics[r[0]], 'probability': str(r[1])})
    return return_list

print('Driver ready')

while True:
    entry = input('')
    components = entry.split(DELIMITER)
    identifier = components.pop()
    matrix = predict_topic(DELIMITER.join(components))
    print('{}{}{}'.format(json.dumps(matrix), DELIMITER, identifier))