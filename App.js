import React, { Component} from "react"

import {
  AsyncStorage,
  Button,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { DOMParser } from "xmldom"
import $ from 'jquery'
import SoundPlayer from "react-native-sound-player"
import { useState } from "react/cjs/react.production.min"

class App extends Component {
  state = {
    podcasts: undefined,
    podcast: undefined,
    podcastDocument: undefined,
    track: undefined,
    subscriptions: [],
    terms: undefined,
    tab: "search",
  }

  async componentDidMount() {
    const subscriptions = await AsyncStorage.getItem(
      "subscriptions",
    )

    const parsed = subscriptions
      ? JSON.parse(subscriptions)
      : []

    this.setState({
      subscriptions: parsed,
      tab: parsed.length > 0 ? "listen" : "search",
    })
   // this.clearStorage()
  }
  

  render() {
    const { tab } = this.state

    if (tab === "search") {
      return this.renderSearch()
    }

    return this.renderListen()
  }
 /* clearStorage = async () => {
    try {
      await AsyncStorage.clear()
      alert('Storage successfully cleared!')
    } catch (e) {
      alert('Failed to clear the async storage.')
    }
  }*/

  onChangeTerms = e => {
    this.setState({ terms: e.nativeEvent.text })
  }

  onPressSearch = async () => {
    const { terms } = this.state

    const uri = `https://itunes.apple.com/search?media=podcast&term=${terms}`

    const result = await fetch(uri)
    const json = await result.json()

    this.setState({
      podcasts: json.results,
    })
  }

  onPressSearchPodcast = async podcast => {
    const { subscriptions: previous } = this.state

    const subscriptions = [...previous, podcast]

    this.setState({
      subscriptions,
    })

    await AsyncStorage.setItem(
      "subscriptions",
      JSON.stringify(subscriptions),
    )
  }

  onPressListenPodcast = async podcast => {
    const result = await fetch(podcast.feedUrl)
    const text = await result.text()

    const podcastDocument = new DOMParser().parseFromString(
      text,
      "text/xml",
    )
    this.setState({ podcast, podcastDocument })
  }

  onPressPodcastTrack = async track => {
    const titles = Array.prototype.slice.call(
      track.getElementsByTagName("title"),
    )
    SoundPlayer.loadUrl(track.getElementsByTagName("enclosure")[0].getAttribute("url"))
    console.log(track.getElementsByTagName("enclosure")[0].getAttribute("url"))
    this.playPodcast(track.getElementsByTagName("enclosure")[0].getAttribute("url"))
    //console.log(` ${url[0].childNodes[0].nodeValue}`)
    alert(`Play ${titles[0].childNodes[0].nodeValue}`)
  }
playPodcast(url){
  try{
    this.pausePodcast(url)
    SoundPlayer.playUrl(url)
  }
  catch(e){
    console.log("cannot play the sound", e)
  }
}
pausePodcast(url){
SoundPlayer.pause(url)
}
  renderSearch() {
    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          padding: 25,
        }}
      >
        {this.renderTabs()}
        <TextInput
          style={{
            width: "100%",
            borderColor: "#e0e0e0",
            borderWidth: 1,
            borderRadius: 4,
            padding: 10,
          }}
          onChange={this.onChangeTerms}
        />
        <Button
          title="Search"
          onPress={this.onPressSearch}
        />
        {this.renderSearchPodcasts()}
      </View>
    )
  }

  renderTabs = () => {
    const { tab } = this.state

    return (
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => this.setState({ tab: "search" })}
        >
          <View
            style={{
              paddingTop: 10,
              paddingBottom: 10,
            }}
          >
            <Text
              style={{
                color:
                  tab === "search" ? "#e0e0e0" : "#007afb",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Search
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.setState({ tab: "listen" })}
        >
          <View
            style={{
              paddingTop: 10,
              paddingBottom: 10,
            }}
          >
            <Text
              style={{
                color:
                  tab === "listen" ? "#e0e0e0" : "#007afb",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Listen
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  renderSearchPodcasts = () => {
    const { podcasts, subscriptions } = this.state

    if (podcasts === undefined) {
      return null
    }

    if (podcasts.length < 1) {
      return (
        <View>
          <Text>
            There are no podcasts matching these terms
          </Text>
        </View>
      )
    }

    const subscriptionIds = subscriptions.map(
      podcast => podcast.collectionId,
    )

    return (
      <ScrollView
        style={{
          flexGrow: 0,
          width: "100%",
          height: "50%",
        }}
      >
        {podcasts.map(podcast =>
          this.renderSearchPodcast(
            podcast,
            subscriptionIds.includes(podcast.collectionId),
          ),
        )}
      </ScrollView>
    )
  }

  renderSearchPodcast = (podcast, isSubscribed) => {
    return (
      <TouchableOpacity
        key={podcast.collectionId}
        onPress={() => {
          if (isSubscribed) {
            return
          }

          this.onPressSearchPodcast(podcast)
        }}
      >
        <View
          style={{
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <Text
            style={{
              color: isSubscribed ? "#e0e0e0" : "#007afb",
              fontSize: 18,
            }}
          >
            {podcast.collectionName}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  renderListen = () => {
    const { subscriptions, podcast } = this.state

    return (
      <View
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          padding: 25,
        }}
      >
        {this.renderTabs()}
        <ScrollView
          style={{
            flexGrow: 0,
            width: "100%",
            height: "50%",
          }}
        >
          {podcast
            ? this.renderPodcastTracks()
            : subscriptions.map(podcast =>
                this.renderListenPodcast(podcast),
              )}
        </ScrollView>
      </View>
    )
  }

  renderPodcastTracks = () => {
    const { podcast, podcastDocument } = this.state

    const items = podcastDocument.getElementsByTagName(
      "item",
    )

    return (
      <View>
        <View
          style={{
            width: "100%",
            height: 100,
          }}
        >
          <Image
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="cover"
            source={{
              uri: podcast.artworkUrl600,
            }}
          />
        </View>
        {Array.prototype.slice
          .call(items)
          .map(this.renderPodcastTrack)}
      </View>
    )
  }

  renderPodcastTrack = track => {
    const links = Array.prototype.slice.call(
      track.getElementsByTagName("link"),
    )

    const titles = Array.prototype.slice.call(
      track.getElementsByTagName("title"),
    )

    const items = Array.prototype.slice.call(
      track.getElementsByTagName("item")
    )

    return (
      <TouchableOpacity
        key={links[0].childNodes[0].nodeValue}
        onPress={() =>{ this.onPressPodcastTrack(track)
          //console.log(links[0].childNodes[0].nodeValue)
        }}
      >
        <View
          style={{
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <Text
            style={{
              color: "#007afb",
              fontSize: 18,
            }}
          >
            {titles[0].childNodes[0].nodeValue}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  renderListenPodcast = podcast => {
    return (
      <TouchableOpacity
        key={podcast.collectionId}
        onPress={() => this.onPressListenPodcast(podcast)}
      >
        <View
          style={{
            width: "100%",
            height: 200,
          }}
        >
          <Image
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="cover"
            source={{
              uri: podcast.artworkUrl600,
            }}
          />
        </View>
      </TouchableOpacity>
    )
  }
}

export default App