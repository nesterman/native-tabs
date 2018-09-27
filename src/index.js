import React, { Component } from "react";
import PropTypes from "prop-types";
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewPropTypes, ScrollView } from "react-native";

export default class NativeTabs extends Component {
  state = {
    underlineWidthAm: new Animated.Value(0),
    underlineOffsetAm: new Animated.ValueXY({x: 0, y: 0}),
    tabViewWidth: null,
    scrollViewWidth: null,
    scrollStep: null,
    scrollEnabled: true
  }
  componentWillUpdate(nextProps, nextState) {
    if (
      nextState.scrollStep === null &&
      !!nextState.tabViewWidth &&
      !!nextState.scrollViewWidth
    ) this.saveStap(nextState.tabViewWidth, nextState.scrollViewWidth);
  }
  saveStap(tabViewWidth, scrollViewWidth) {
    const scrollStep = (tabViewWidth - scrollViewWidth) / this.props.tabs.length;
    this.setState({
      scrollStep,
      scrollEnabled: tabViewWidth > scrollViewWidth
    });
  }
  onLayoutTabView = (event) => {
    const { width } = event.nativeEvent.layout;
    this.setState({
      tabViewWidth: width
    });
  }
  onLayoutScrollView = (event) => {
    const { width } = event.nativeEvent.layout;
    this.setState({
      scrollViewWidth: width
    });
  }
  onLayoutActiveTab = (event) => {
    const { x, width } = event.nativeEvent.layout;
    this.setState({
      underlineWidthAm: new Animated.Value(width),
      underlineOffsetAm: new Animated.ValueXY({x: x, y: 0})
    });
  }
  createActiveTabRef = (c) => {
    if (c) c.measure((fx, _, width) => {
      this.moveUnderline({offset: fx, width: width});
    });
    this.activeTab = c;
  }
  onTab = (tab, i) => {
    if (this.state.scrollEnabled) {
      const move = this.state.scrollStep * i;
      const x = this.props.tabs.length / 2 < i ? move + this.state.scrollStep : move;
      this.scrollView.scrollTo({x: x, animated: true});
    }
    if (!this.props.disabled) this.props.onTab(tab);
  }
  getUnderlineStyle = () => {
    const t = this.state.underlineOffsetAm.getTranslateTransform();
    const propStyles = this.getStyles(this.props.styles)("underline");
    return [
      styles.underline, propStyles, {
        width: this.state.underlineWidthAm,
      }, {
        transform: t
      }
    ]
  }
  moveUnderline = ({offset, width}) => {
    if (width) Animated.parallel([
      Animated.timing(this.state.underlineOffsetAm, {
        toValue: {x: offset, y: 0},
        duration: 500,
        useNativeDriver: this.props.useNativeDriver
      }),
      Animated.timing(this.state.underlineWidthAm, {
        toValue: width,
        duration: 500,
      })
    ]).start();
  }
  getStyles = (styles) => {
      return (c) => !!styles && !!styles[c] ? styles[c] : null
  }
  render() {
    const styleOf = this.getStyles(this.props.styles);
    const Tabs = (
      <Animated.View style={[styles.tabs , styleOf("tabs")]} onLayout={this.onLayoutTabView}>
        {
          this.props.tabs.map((tab, index) => {

            let style = null;
            let onLayout = null;
            let refs = {};
            if (this.props.activeTab.id === tab.id) {
              style = {
                tab: [styles.tab, styles.activeTab, styleOf("tab"), styleOf("activeTab")],
                text: [styles.tabText, styles.activeTabText, styleOf("tabText"), styleOf("activeTabText")]
              };
              onLayout = this.onLayoutActiveTab;
              refs = { ref: this.createActiveTabRef };
            } else {
              style = {
                tab: [styles.tab, styleOf("tab")],
                text: [styles.tabText, styleOf("tabText")]
              };
              onLayout = null;
            }

            return (
              <TouchableOpacity key={index}
                onLayout={onLayout}
                onPress={this.onTab.bind(this, tab, index)} {...refs}
                style={style.tab}>
                {
                  !!tab.node ? tab.node : (
                    <Text style={style.text}>{tab.name}</Text>
                  )
                }
              </TouchableOpacity>
            )
          })
        }
        <Animated.View style={this.getUnderlineStyle()}/>
      </Animated.View>
    );

    if (this.state.scrollEnabled) {
      return (
        <View style={[styles.wrap , styleOf("wrap")]}>
          <ScrollView
            contentContainerStyle={styles.scrollView}
            directionalLockEnabled={true}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            ref={ref => this.scrollView = ref}
            onLayout={this.onLayoutScrollView}>
            {Tabs}
          </ScrollView>
        </View>
      );
    } else {
      return (
        <View style={[styles.wrap , styleOf("wrap")]}>
          {Tabs}
        </View>
      );
    }
  }
}

NativeTabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id:  PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    name: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    node: PropTypes.node
  })).isRequired,
  activeTab: PropTypes.shape({
    id: PropTypes.any
  }).isRequired,
  onTab: PropTypes.func,
  disabled: PropTypes.bool,
  styles: PropTypes.shape({
    wrap: ViewPropTypes.style,
    tabs: ViewPropTypes.style,
    tab: TouchableOpacity.propTypes.style,
    tabText: Text.propTypes.style,
    activeTab: TouchableOpacity.propTypes.style,
    activeTabText: Text.propTypes.style,
    underline: ViewPropTypes.style
  }),
  useNativeDriver: PropTypes.bool,
}

NativeTabs.defaultProps = {
  disabled: false,
  useNativeDriver: false
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
  },
  scrollView: {
    alignSelf: 'flex-start',
  },
  tabs: {
    position: "relative",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  tab: {
    padding: 8,
  },
  tabText: {
    color: "#e1e1e1"
  },
  activeTab: {
    padding: 8
  },
  activeTabText: {

  },
  underline: {
    position: "absolute",
    bottom: -1,
    backgroundColor: "#e1e1e1",
    height: 4
  }
});
