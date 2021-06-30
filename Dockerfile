FROM tensorflow/tensorflow:2.5.0

COPY . /app

WORKDIR /app

# RUN apt update
# RUN apt install -y -qq wget software-properties-common build-essential libnss3-dev zlib1g-dev libgdbm-dev libncurses5-dev libssl-dev libffi-dev libreadline-dev libsqlite3-dev libbz2-dev
# RUN wget https://www.python.org/ftp/python/3.9.2/Python-3.9.2.tgz
# RUN tar xvf Python-3.9.2.tgz
# RUN ./Python-3.9.2/configure –enable-optimizations

# RUN apt update
# RUN apt install -y python-pip
# RUN apt install -y build-essential libssl-dev libffi-dev python3-dev

# RUN pip install numpy
RUN pip install nltk
RUN python -m nltk.downloader punkt
RUN python -m nltk.downloader wordnet

RUN apt update
RUN apt install -y nodejs npm

RUN npm i

CMD ["npm", "start"]